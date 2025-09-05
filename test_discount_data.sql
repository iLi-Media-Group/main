-- Test discount data to verify what's being sent to Edge Function

-- Check the most recent discount that was created
SELECT 'Most recent discount:' as info;
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

-- Check all promotion code discounts
SELECT 'All promotion code discounts:' as info;
SELECT 
    id,
    name,
    discount_type,
    promotion_code,
    discount_percent,
    start_date,
    end_date,
    stripe_coupon_id,
    stripe_coupon_created_at
FROM discounts
WHERE discount_type = 'promotion_code'
ORDER BY created_at DESC;

-- Test the data that would be sent to Edge Function
SELECT 'Data that would be sent to Edge Function:' as info;
SELECT 
    id as discount_id,
    name,
    discount_type,
    promotion_code,
    discount_percent,
    CASE 
        WHEN discount_percent IS NULL THEN '❌ NULL'
        WHEN discount_percent < 1 THEN '❌ Too low'
        WHEN discount_percent > 100 THEN '❌ Too high'
        WHEN discount_percent = ROUND(discount_percent) THEN '✅ Valid integer'
        ELSE '❌ Not integer'
    END as percent_validation,
    start_date,
    end_date,
    CASE 
        WHEN end_date IS NULL THEN '❌ NULL'
        WHEN end_date < CURRENT_DATE THEN '❌ Past date'
        ELSE '✅ Valid date'
    END as date_validation
FROM discounts
WHERE discount_type = 'promotion_code'
ORDER BY created_at DESC; 