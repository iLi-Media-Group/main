-- Fix Transaction Display and Implement Membership Plan Calculation
-- Run this in your Supabase SQL Editor

-- 1. First, let's check the current compensation settings
SELECT 
    standard_rate,
    exclusive_rate,
    sync_fee_rate,
    no_sales_bucket_rate,
    growth_bonus_rate,
    no_sale_bonus_rate
FROM compensation_settings 
WHERE id = 1;

-- 2. Check current transaction amounts and add original amounts
SELECT 
    pt.id,
    pt.transaction_producer_id,
    pt.type,
    pt.amount as compensation_amount,
    pt.status,
    pt.description,
    pt.created_at,
    -- Calculate original amount based on compensation rate
    CASE 
        WHEN pt.description ILIKE '%sync%' THEN pt.amount / 0.90  -- 90% rate for sync
        WHEN pt.description ILIKE '%sale%' THEN pt.amount / 0.75  -- 75% rate for sales
        ELSE pt.amount  -- Default fallback
    END as original_amount
FROM producer_transactions pt
WHERE pt.type = 'sale'
ORDER BY pt.created_at DESC;

-- 3. Add original_amount column to producer_transactions if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'producer_transactions' 
        AND column_name = 'original_amount'
    ) THEN
        ALTER TABLE producer_transactions ADD COLUMN original_amount NUMERIC;
    END IF;
END $$;

-- 4. Update original_amount for existing transactions
UPDATE producer_transactions 
SET original_amount = 
    CASE 
        WHEN description ILIKE '%sync%' THEN amount / 0.90  -- 90% rate for sync
        WHEN description ILIKE '%sale%' THEN amount / 0.75  -- 75% rate for sales
        ELSE amount  -- Default fallback
    END
WHERE original_amount IS NULL;

-- 5. Create membership plan calculation function
CREATE OR REPLACE FUNCTION calculate_membership_plan_distribution(
    month_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    producer_id UUID,
    producer_email TEXT,
    producer_name TEXT,
    monthly_sales NUMERIC,
    previous_month_sales NUMERIC,
    growth_percentage NUMERIC,
    membership_share NUMERIC,
    growth_bonus NUMERIC,
    total_membership_earnings NUMERIC
) AS $$
DECLARE
    settings RECORD;
    total_membership_revenue NUMERIC := 10000; -- Example: $10,000 monthly membership revenue
    producer_bucket_total NUMERIC;
    total_monthly_sales NUMERIC;
    active_producers_count INTEGER;
    no_sales_bucket NUMERIC;
BEGIN
    -- Get compensation settings
    SELECT * INTO settings FROM compensation_settings WHERE id = 1;
    
    -- Calculate producer bucket (45% of total membership revenue)
    producer_bucket_total := total_membership_revenue * 0.45;
    
    -- Calculate total monthly sales for active producers
    SELECT COALESCE(SUM(pt.amount), 0) INTO total_monthly_sales
    FROM producer_transactions pt
    WHERE pt.type = 'sale'
      AND pt.created_at >= DATE_TRUNC('month', month_date)
      AND pt.created_at < DATE_TRUNC('month', month_date) + INTERVAL '1 month';
    
    -- Calculate no sales bucket (2% of producer bucket)
    no_sales_bucket := producer_bucket_total * (settings.no_sales_bucket_rate / 100.0);
    
    -- Return distribution for each producer
    RETURN QUERY
    SELECT 
        p.id as producer_id,
        p.email as producer_email,
        CONCAT(p.first_name, ' ', p.last_name) as producer_name,
        COALESCE(current_month.sales, 0) as monthly_sales,
        COALESCE(previous_month.sales, 0) as previous_month_sales,
        CASE 
            WHEN COALESCE(previous_month.sales, 0) > 0 
            THEN ((COALESCE(current_month.sales, 0) - COALESCE(previous_month.sales, 0)) / COALESCE(NULLIF(previous_month.sales, 0), 1)) * 100
            ELSE 0
        END as growth_percentage,
        CASE 
            WHEN COALESCE(current_month.sales, 0) > 0 AND total_monthly_sales > 0
            THEN (COALESCE(current_month.sales, 0) / total_monthly_sales) * (producer_bucket_total - no_sales_bucket)
            ELSE 0
        END as membership_share,
        CASE 
            WHEN COALESCE(current_month.sales, 0) > 0 
            AND COALESCE(previous_month.sales, 0) > 0
            AND ((COALESCE(current_month.sales, 0) - COALESCE(previous_month.sales, 0)) / COALESCE(NULLIF(previous_month.sales, 0), 1)) > 0.1
            AND total_monthly_sales > 0
            THEN (COALESCE(current_month.sales, 0) / total_monthly_sales) * (producer_bucket_total * (settings.growth_bonus_rate / 100.0))
            ELSE 0
        END as growth_bonus,
        CASE 
            WHEN COALESCE(current_month.sales, 0) > 0 AND total_monthly_sales > 0
            THEN (COALESCE(current_month.sales, 0) / total_monthly_sales) * (producer_bucket_total - no_sales_bucket)
            ELSE 0
        END + 
        CASE 
            WHEN COALESCE(current_month.sales, 0) > 0 
            AND COALESCE(previous_month.sales, 0) > 0
            AND ((COALESCE(current_month.sales, 0) - COALESCE(previous_month.sales, 0)) / COALESCE(NULLIF(previous_month.sales, 0), 1)) > 0.1
            AND total_monthly_sales > 0
            THEN (COALESCE(current_month.sales, 0) / total_monthly_sales) * (producer_bucket_total * (settings.growth_bonus_rate / 100.0))
            ELSE 0
        END as total_membership_earnings
    FROM profiles p
    LEFT JOIN (
        SELECT 
            pt.transaction_producer_id,
            SUM(pt.amount) as sales
        FROM producer_transactions pt
        WHERE pt.type = 'sale'
          AND pt.created_at >= DATE_TRUNC('month', month_date)
          AND pt.created_at < DATE_TRUNC('month', month_date) + INTERVAL '1 month'
        GROUP BY pt.transaction_producer_id
    ) current_month ON p.id = current_month.transaction_producer_id
    LEFT JOIN (
        SELECT 
            pt.transaction_producer_id,
            SUM(pt.amount) as sales
        FROM producer_transactions pt
        WHERE pt.type = 'sale'
          AND pt.created_at >= DATE_TRUNC('month', month_date) - INTERVAL '1 month'
          AND pt.created_at < DATE_TRUNC('month', month_date)
        GROUP BY pt.transaction_producer_id
    ) previous_month ON p.id = previous_month.transaction_producer_id
    WHERE p.account_type IN ('producer', 'admin')
    ORDER BY total_membership_earnings DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. Test the membership plan calculation for current month
SELECT * FROM calculate_membership_plan_distribution();

-- 7. Show transaction breakdown with original and compensation amounts
SELECT 
    pt.id,
    pt.transaction_producer_id,
    pt.type,
    pt.original_amount,
    pt.amount as compensation_amount,
    pt.status,
    pt.description,
    pt.created_at,
    ROUND(((pt.amount / pt.original_amount) * 100), 2) as compensation_percentage
FROM producer_transactions pt
WHERE pt.type = 'sale'
ORDER BY pt.created_at DESC;

-- 8. Show summary of transaction amounts
SELECT 
    'Total Original Amount' as metric,
    COALESCE(SUM(original_amount), 0) as value
FROM producer_transactions pt
WHERE pt.type = 'sale'

UNION ALL

SELECT 
    'Total Compensation Amount' as metric,
    COALESCE(SUM(amount), 0) as value
FROM producer_transactions pt
WHERE pt.type = 'sale'

UNION ALL

SELECT 
    'Average Compensation Rate' as metric,
    ROUND(AVG((amount / original_amount) * 100), 2) as value
FROM producer_transactions pt
WHERE pt.type = 'sale' AND original_amount > 0; 