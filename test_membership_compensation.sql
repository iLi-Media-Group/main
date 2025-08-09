-- Test and Fix Membership Compensation Plan
-- This script will test the table structures and fix any issues

-- 1. First, let's check what columns exist in the profiles table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE '%stripe%'
ORDER BY column_name;

-- 2. Check what columns exist in the stripe_subscriptions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'stripe_subscriptions' 
ORDER BY column_name;

-- 3. Check if there are any active subscriptions (without the problematic join)
SELECT 
    ss.id,
    ss.customer_id,
    ss.price_id,
    ss.status,
    ss.current_period_start,
    ss.current_period_end,
    ss.created_at,
    to_timestamp(ss.current_period_start) as period_start_date,
    to_timestamp(ss.current_period_end) as period_end_date
FROM stripe_subscriptions ss
WHERE ss.status = 'active'
LIMIT 10;

-- 4. Check if there are any profiles with any stripe-related columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND (column_name LIKE '%stripe%' OR column_name LIKE '%customer%')
ORDER BY column_name;

-- 5. Check if there's a stripe_customers table that we should be using
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%stripe%' 
AND table_schema = 'public'
ORDER BY table_name;

-- 6. If stripe_customers table exists, check its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'stripe_customers' 
ORDER BY column_name;

-- 7. Create a working version that doesn't rely on the problematic join
CREATE OR REPLACE FUNCTION calculate_membership_revenue_summary_working(
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
    WHERE ss.status = 'active'
      AND to_timestamp(ss.current_period_end) >= month_date
      AND to_timestamp(ss.current_period_start) < month_date + INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;

-- 8. Test the working function
SELECT * FROM calculate_membership_revenue_summary_working();

-- 9. Show all active subscriptions with their details (without problematic join)
SELECT 
    ss.id,
    ss.customer_id,
    ss.price_id,
    ss.status,
    to_timestamp(ss.current_period_start) as period_start_date,
    to_timestamp(ss.current_period_end) as period_end_date,
    CASE 
        WHEN ss.price_id = 'price_gold_monthly' THEN 34.99
        WHEN ss.price_id = 'price_platinum_monthly' THEN 59.99
        WHEN ss.price_id = 'price_ultimate_monthly' THEN 499.99
        ELSE 0
    END as monthly_amount
FROM stripe_subscriptions ss
WHERE ss.status = 'active'
ORDER BY ss.created_at DESC;

-- 10. If we need to join with profiles, let's see what the correct join should be
-- First, let's see if there's a stripe_customers table that links them
SELECT 
    sc.user_id,
    sc.customer_id,
    p.email,
    p.account_type
FROM stripe_customers sc
JOIN profiles p ON sc.user_id = p.id
LIMIT 5;

-- 11. Now create a function that uses the correct join through stripe_customers
CREATE OR REPLACE FUNCTION calculate_membership_revenue_summary_with_join(
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

-- 12. Test the function with correct join
SELECT * FROM calculate_membership_revenue_summary_with_join();
