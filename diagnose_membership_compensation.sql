-- Diagnose Membership Compensation Issues
-- This script will help us understand why the functions are returning 0 results

-- 1. Check if stripe_subscriptions table exists and has data
SELECT 'stripe_subscriptions table check:' as info;
SELECT COUNT(*) as total_subscriptions FROM stripe_subscriptions;

-- 2. Check all subscriptions regardless of status
SELECT 'All subscriptions by status:' as info;
SELECT 
    status,
    COUNT(*) as count,
    COUNT(CASE WHEN price_id IS NOT NULL THEN 1 END) as with_price_id
FROM stripe_subscriptions 
GROUP BY status
ORDER BY count DESC;

-- 3. Check active subscriptions with their details
SELECT 'Active subscriptions details:' as info;
SELECT 
    id,
    customer_id,
    price_id,
    status,
    current_period_start,
    current_period_end,
    to_timestamp(current_period_start) as period_start_date,
    to_timestamp(current_period_end) as period_end_date,
    created_at
FROM stripe_subscriptions 
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if stripe_customers table exists and has data
SELECT 'stripe_customers table check:' as info;
SELECT COUNT(*) as total_customers FROM stripe_customers;

-- 5. Check stripe_customers with their details
SELECT 'Stripe customers details:' as info;
SELECT 
    id,
    user_id,
    customer_id,
    created_at
FROM stripe_customers 
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check if we can join stripe_subscriptions with stripe_customers
SELECT 'Join test - stripe_subscriptions with stripe_customers:' as info;
SELECT 
    ss.id as subscription_id,
    ss.customer_id as subscription_customer_id,
    ss.price_id,
    ss.status,
    sc.id as customer_record_id,
    sc.customer_id as customer_customer_id,
    sc.user_id
FROM stripe_subscriptions ss
LEFT JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
WHERE ss.status = 'active'
ORDER BY ss.created_at DESC
LIMIT 10;

-- 7. Check if we can join all the way to profiles
SELECT 'Join test - all the way to profiles:' as info;
SELECT 
    ss.id as subscription_id,
    ss.customer_id,
    ss.price_id,
    ss.status,
    sc.user_id,
    p.id as profile_id,
    p.email,
    p.account_type
FROM stripe_subscriptions ss
LEFT JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
LEFT JOIN profiles p ON sc.user_id = p.id
WHERE ss.status = 'active'
ORDER BY ss.created_at DESC
LIMIT 10;

-- 8. Check date filtering - see what dates we're working with
SELECT 'Date filtering test:' as info;
SELECT 
    CURRENT_DATE as current_date,
    DATE_TRUNC('month', CURRENT_DATE) as month_start,
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' as month_end;

-- 9. Check if any subscriptions fall within current month
SELECT 'Subscriptions within current month:' as info;
SELECT 
    ss.id,
    ss.customer_id,
    ss.price_id,
    ss.status,
    to_timestamp(ss.current_period_start) as period_start_date,
    to_timestamp(ss.current_period_end) as period_end_date,
    CASE 
        WHEN to_timestamp(ss.current_period_end) >= CURRENT_DATE 
        AND to_timestamp(ss.current_period_start) < CURRENT_DATE + INTERVAL '1 month'
        THEN 'IN_RANGE'
        ELSE 'OUT_OF_RANGE'
    END as date_check
FROM stripe_subscriptions ss
WHERE ss.status = 'active'
ORDER BY ss.created_at DESC
LIMIT 10;

-- 10. Check if there are any subscriptions at all that match our criteria
SELECT 'Final test - subscriptions matching all criteria:' as info;
SELECT 
    COUNT(*) as matching_subscriptions,
    COUNT(DISTINCT ss.customer_id) as unique_customers
FROM stripe_subscriptions ss
JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
JOIN profiles p ON sc.user_id = p.id
WHERE ss.status = 'active'
  AND to_timestamp(ss.current_period_end) >= CURRENT_DATE
  AND to_timestamp(ss.current_period_start) < CURRENT_DATE + INTERVAL '1 month';

-- 11. Check what price_ids exist in the database
SELECT 'Available price_ids:' as info;
SELECT 
    price_id,
    COUNT(*) as count
FROM stripe_subscriptions 
WHERE price_id IS NOT NULL
GROUP BY price_id
ORDER BY count DESC;

-- 12. Test the working function with a broader date range
SELECT 'Test with broader date range:' as info;
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
  AND to_timestamp(ss.current_period_end) >= CURRENT_DATE - INTERVAL '6 months'
  AND to_timestamp(ss.current_period_start) < CURRENT_DATE + INTERVAL '6 months';
