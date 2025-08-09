-- Implement Membership Revenue Distribution System
-- This script implements the 45% producer bucket for membership payments
-- that gets distributed among producers based on their sales performance

-- 1. First, ensure compensation_settings table has all required fields
DO $$ 
BEGIN
    -- Add membership-related columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'compensation_settings' 
        AND column_name = 'no_sales_bucket_rate'
    ) THEN
        ALTER TABLE compensation_settings ADD COLUMN no_sales_bucket_rate INTEGER NOT NULL DEFAULT 2;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'compensation_settings' 
        AND column_name = 'growth_bonus_rate'
    ) THEN
        ALTER TABLE compensation_settings ADD COLUMN growth_bonus_rate INTEGER NOT NULL DEFAULT 5;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'compensation_settings' 
        AND column_name = 'no_sale_bonus_rate'
    ) THEN
        ALTER TABLE compensation_settings ADD COLUMN no_sale_bonus_rate INTEGER NOT NULL DEFAULT 3;
    END IF;
END $$;

-- 2. Update compensation settings with current rates
INSERT INTO compensation_settings (id, standard_rate, exclusive_rate, sync_fee_rate, holding_period, minimum_withdrawal, processing_fee, no_sales_bucket_rate, growth_bonus_rate, no_sale_bonus_rate)
VALUES (1, 75, 80, 90, 30, 50, 2, 2, 5, 3)
ON CONFLICT (id) DO UPDATE
SET 
    standard_rate = 75,
    exclusive_rate = 80,
    sync_fee_rate = 90,
    no_sales_bucket_rate = 2,
    growth_bonus_rate = 5,
    no_sale_bonus_rate = 3,
    updated_at = now();

-- 3. Create function to calculate membership revenue summary
CREATE OR REPLACE FUNCTION calculate_membership_revenue_summary(
    month_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    active_subscriptions BIGINT,
    total_monthly_revenue NUMERIC,
    producer_bucket_amount NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as active_subscriptions,
        COALESCE(SUM(
            CASE 
                WHEN ss.price_id = 'price_gold_monthly' THEN 34.99
                WHEN ss.price_id = 'price_platinum_monthly' THEN 59.99
                WHEN ss.price_id = 'price_ultimate_monthly' THEN 499.99
                ELSE 0
            END
        ), 0) as total_monthly_revenue,
        COALESCE(SUM(
            CASE 
                WHEN ss.price_id = 'price_gold_monthly' THEN 34.99
                WHEN ss.price_id = 'price_platinum_monthly' THEN 59.99
                WHEN ss.price_id = 'price_ultimate_monthly' THEN 499.99
                ELSE 0
            END
        ), 0) * 0.45 as producer_bucket_amount
    FROM stripe_subscriptions ss
    JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
    JOIN profiles p ON sc.user_id = p.id
    WHERE ss.status = 'active'
      AND to_timestamp(ss.current_period_end) >= month_date
      AND to_timestamp(ss.current_period_start) < month_date + INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;

-- 4. Create function to calculate membership revenue distribution
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
    total_membership_revenue NUMERIC;
    producer_bucket_total NUMERIC;
    total_monthly_sales NUMERIC;
    no_sales_bucket NUMERIC;
BEGIN
    -- Get compensation settings
    SELECT * INTO settings FROM compensation_settings WHERE id = 1;
    
    -- Calculate total membership revenue from active subscriptions
    SELECT COALESCE(SUM(
        CASE 
            WHEN ss.price_id = 'price_gold_monthly' THEN 34.99
            WHEN ss.price_id = 'price_platinum_monthly' THEN 59.99
            WHEN ss.price_id = 'price_ultimate_monthly' THEN 499.99
            ELSE 0
        END
    ), 0) INTO total_membership_revenue
    FROM stripe_subscriptions ss
    JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
    JOIN profiles p ON sc.user_id = p.id
    WHERE ss.status = 'active'
      AND to_timestamp(ss.current_period_end) >= month_date
      AND to_timestamp(ss.current_period_start) < month_date + INTERVAL '1 month';
    
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
    WHERE p.account_type IN ('producer', 'admin,producer')
    ORDER BY total_membership_earnings DESC;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to actually distribute membership revenue to producers
CREATE OR REPLACE FUNCTION distribute_membership_revenue(
    month_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
DECLARE
    settings RECORD;
    total_membership_revenue NUMERIC;
    producer_bucket_total NUMERIC;
    total_monthly_sales NUMERIC;
    no_sales_bucket NUMERIC;
    producer_record RECORD;
    producer_share NUMERIC;
    growth_bonus NUMERIC;
    no_sale_bonus NUMERIC;
    total_producers INTEGER;
    active_producers INTEGER;
    inactive_producers INTEGER;
BEGIN
    -- Get compensation settings
    SELECT * INTO settings FROM compensation_settings WHERE id = 1;
    
    -- Calculate total membership revenue from active subscriptions
    SELECT COALESCE(SUM(
        CASE 
            WHEN ss.price_id = 'price_gold_monthly' THEN 34.99
            WHEN ss.price_id = 'price_platinum_monthly' THEN 59.99
            WHEN ss.price_id = 'price_ultimate_monthly' THEN 499.99
            ELSE 0
        END
    ), 0) INTO total_membership_revenue
    FROM stripe_subscriptions ss
    JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
    JOIN profiles p ON sc.user_id = p.id
    WHERE ss.status = 'active'
      AND to_timestamp(ss.current_period_end) >= month_date
      AND to_timestamp(ss.current_period_start) < month_date + INTERVAL '1 month';
    
    -- Calculate producer bucket (45% of total membership revenue)
    producer_bucket_total := total_membership_revenue * 0.45;
    
    -- Calculate total monthly sales for active producers
    SELECT COALESCE(SUM(pt.amount), 0) INTO total_monthly_sales
    FROM producer_transactions pt
    WHERE pt.type = 'sale'
      AND pt.created_at >= DATE_TRUNC('month', month_date)
      AND pt.created_at < DATE_TRUNC('month', month_date) + INTERVAL '1 month';
    
    -- Calculate the number of producers
    SELECT COUNT(*) INTO total_producers
    FROM profiles p
    WHERE p.account_type IN ('producer', 'admin,producer');
    
    -- Calculate active producers (those with sales in the last month)
    SELECT COUNT(DISTINCT pt.transaction_producer_id) INTO active_producers
    FROM producer_transactions pt
    WHERE pt.type = 'sale'
      AND pt.created_at >= DATE_TRUNC('month', month_date)
      AND pt.created_at < DATE_TRUNC('month', month_date) + INTERVAL '1 month';
    
    -- Calculate inactive producers
    inactive_producers := total_producers - active_producers;
    
    -- Calculate no sales bucket (2% of producer bucket)
    no_sales_bucket := producer_bucket_total * (settings.no_sales_bucket_rate / 100.0);
    
    -- Distribute to each producer
    FOR producer_record IN 
        SELECT 
            p.id AS producer_id,
            COALESCE(current_month.sales, 0) AS monthly_sales,
            COALESCE(previous_month.sales, 0) AS previous_month_sales
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
        WHERE p.account_type IN ('producer', 'admin,producer')
    LOOP
        -- Calculate base share for this producer
        IF producer_record.monthly_sales > 0 THEN
            -- Active producer - gets share based on sales performance
            producer_share := (producer_record.monthly_sales / total_monthly_sales) * (producer_bucket_total - no_sales_bucket);
            
            -- Check for growth bonus (10% growth threshold)
            IF producer_record.monthly_sales > producer_record.previous_month_sales 
               AND ((producer_record.monthly_sales - producer_record.previous_month_sales) / NULLIF(producer_record.previous_month_sales, 0)) > 0.1 THEN
                growth_bonus := producer_share * (settings.growth_bonus_rate / 100.0);
                producer_share := producer_share + growth_bonus;
            ELSE
                growth_bonus := 0;
            END IF;
        ELSE
            -- Inactive producer - gets share from no sales bucket
            producer_share := no_sales_bucket / NULLIF(inactive_producers, 0);
            
            -- Add no sale bonus
            no_sale_bonus := producer_share * (settings.no_sale_bonus_rate / 100.0);
            producer_share := producer_share + no_sale_bonus;
        END IF;
        
        -- Only create transaction if producer_share > 0
        IF producer_share > 0 THEN
            -- Update producer balance
            INSERT INTO producer_balances (producer_id, available_balance, pending_balance, lifetime_earnings)
            VALUES (producer_record.producer_id, 0, producer_share, producer_share)
            ON CONFLICT (producer_id) DO UPDATE
            SET 
                pending_balance = producer_balances.pending_balance + EXCLUDED.pending_balance,
                lifetime_earnings = producer_balances.lifetime_earnings + EXCLUDED.lifetime_earnings,
                updated_at = now();
            
            -- Create transaction record
            INSERT INTO producer_transactions (
                producer_id,
                amount,
                type,
                status,
                description,
                created_at
            ) VALUES (
                producer_record.producer_id,
                producer_share,
                'membership_share',
                'completed',
                'Membership Revenue Share: ' || to_char(month_date, 'Month YYYY'),
                now()
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. Create a scheduled function to run membership distribution monthly
CREATE OR REPLACE FUNCTION run_monthly_membership_distribution()
RETURNS VOID AS $$
BEGIN
    -- Run distribution for the previous month
    PERFORM distribute_membership_revenue(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'));
END;
$$ LANGUAGE plpgsql;

-- 7. Test the calculation function for current month
SELECT 
    producer_name,
    monthly_sales,
    previous_month_sales,
    growth_percentage,
    membership_share,
    growth_bonus,
    total_membership_earnings
FROM calculate_membership_plan_distribution();

-- 8. Show current compensation settings
SELECT 
    standard_rate,
    exclusive_rate,
    sync_fee_rate,
    no_sales_bucket_rate,
    growth_bonus_rate,
    no_sale_bonus_rate
FROM compensation_settings 
WHERE id = 1;

-- 9. Show current membership revenue calculation
SELECT 
    COUNT(*) as active_subscriptions,
    SUM(
        CASE 
            WHEN ss.price_id = 'price_gold_monthly' THEN 34.99
            WHEN ss.price_id = 'price_platinum_monthly' THEN 59.99
            WHEN ss.price_id = 'price_ultimate_monthly' THEN 499.99
            ELSE 0
        END
    ) as total_monthly_revenue,
    SUM(
        CASE 
            WHEN ss.price_id = 'price_gold_monthly' THEN 34.99
            WHEN ss.price_id = 'price_platinum_monthly' THEN 59.99
            WHEN ss.price_id = 'price_ultimate_monthly' THEN 499.99
            ELSE 0
        END
    ) * 0.45 as producer_bucket_amount
FROM stripe_subscriptions ss
JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
JOIN profiles p ON sc.user_id = p.id
WHERE ss.status = 'active'
  AND to_timestamp(ss.current_period_end) >= CURRENT_DATE
  AND to_timestamp(ss.current_period_start) < CURRENT_DATE + INTERVAL '1 month';
