-- Debug the Edge Function issue

-- Check the most recent discount that was created
SELECT 'Most recent discount data:' as info;
SELECT 
    id,
    name,
    discount_type,
    promotion_code,
    discount_percent,
    start_date,
    end_date,
    stripe_coupon_id,
    stripe_coupon_created_at,
    created_at
FROM discounts
ORDER BY created_at DESC
LIMIT 1;

-- Check if there are any discounts with invalid percent values
SELECT 'Checking for invalid discount_percent values:' as info;
SELECT 
    id,
    name,
    discount_percent,
    CASE 
        WHEN discount_percent IS NULL THEN '❌ NULL'
        WHEN discount_percent < 1 THEN '❌ Too low (< 1)'
        WHEN discount_percent > 100 THEN '❌ Too high (> 100)'
        WHEN discount_percent != ROUND(discount_percent) THEN '❌ Not integer'
        ELSE '✅ Valid'
    END as validation
FROM discounts
WHERE discount_type = 'promotion_code'
ORDER BY created_at DESC;

-- Test the exact data that would be sent to Stripe
SELECT 'Data that would be sent to Stripe:' as info;
SELECT 
    id as discount_id,
    name,
    promotion_code as coupon_id,
    discount_percent,
    ROUND(discount_percent) as percent_off_integer,
    end_date,
    CASE 
        WHEN end_date IS NOT NULL THEN EXTRACT(EPOCH FROM end_date::date)
        ELSE NULL
    END as redeem_by_timestamp
FROM discounts
WHERE discount_type = 'promotion_code'
ORDER BY created_at DESC
LIMIT 1; 