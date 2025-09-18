-- Test checkout integration with discount functions

-- 1. Check if the Stripe price mapping is correct
SELECT '1. Testing Stripe price mapping:' as info;
SELECT 
    'price_1RdAeZR8RYA8TFzwVH3MHECa' as price_id,
    'single_track' as expected_product,
    CASE 
        WHEN 'price_1RdAeZR8RYA8TFzwVH3MHECa' = 'price_1RdAeZR8RYA8TFzwVH3MHECa' THEN 'MATCHES'
        ELSE 'NO MATCH'
    END as mapping_status;

-- 2. Test the discount calculation with the exact parameters used in checkout
SELECT '2. Testing discount calculation with checkout parameters:' as info;
SELECT 
    'single_track' as product_name,
    CURRENT_DATE as check_date,
    * FROM calculate_discounted_price(1000, 'single_track', CURRENT_DATE);

-- 3. Test the discount calculation with different amounts
SELECT '3. Testing discount calculation with different amounts:' as info;
SELECT 
    '1000 cents ($10.00)' as original_price,
    * FROM calculate_discounted_price(1000, 'single_track', CURRENT_DATE)
UNION ALL
SELECT 
    '2000 cents ($20.00)' as original_price,
    * FROM calculate_discounted_price(2000, 'single_track', CURRENT_DATE)
UNION ALL
SELECT 
    '5000 cents ($50.00)' as original_price,
    * FROM calculate_discounted_price(5000, 'single_track', CURRENT_DATE);

-- 4. Check if there are any RLS policy issues that might block the service role
SELECT '4. Checking RLS policies on discounts table:' as info;
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'discounts';

-- 5. Test if the service role can access discounts
SELECT '5. Testing service role access to discounts:' as info;
SELECT COUNT(*) as total_discounts FROM discounts;
SELECT COUNT(*) as active_discounts FROM discounts WHERE is_active = true;
SELECT COUNT(*) as today_active_discounts FROM discounts 
WHERE is_active = true 
AND CURRENT_DATE BETWEEN start_date AND end_date;

-- 6. Check all discounts that should apply to single_track today
SELECT '6. All discounts that should apply to single_track today:' as info;
SELECT 
    name,
    discount_percent,
    applies_to,
    discount_type,
    is_automatic,
    start_date,
    end_date,
    is_active,
    CASE 
        WHEN 'single_track' = ANY(applies_to) THEN 'DIRECT'
        WHEN 'all' = ANY(applies_to) THEN 'ALL PRODUCTS'
        ELSE 'NO MATCH'
    END as match_type
FROM discounts
WHERE is_active = true
AND CURRENT_DATE BETWEEN start_date AND end_date
AND ('single_track' = ANY(applies_to) OR 'all' = ANY(applies_to))
ORDER BY discount_percent DESC; 