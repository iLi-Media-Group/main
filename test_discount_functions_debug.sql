-- Comprehensive test to debug why Grand Opening Sale isn't being applied

-- 1. Check if the discount functions exist and work
SELECT '1. Testing discount functions:' as info;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN ('get_applicable_discounts', 'calculate_discounted_price')
AND routine_schema = 'public';

-- 2. Test the get_applicable_discounts function directly
SELECT '2. Testing get_applicable_discounts for single_track:' as info;
SELECT * FROM get_applicable_discounts('single_track', CURRENT_DATE);

-- 3. Test the calculate_discounted_price function directly
SELECT '3. Testing calculate_discounted_price for single_track:' as info;
SELECT * FROM calculate_discounted_price(1000, 'single_track', CURRENT_DATE);

-- 4. Check if the Grand Opening Sale discount is properly configured
SELECT '4. Grand Opening Sale discount details:' as info;
SELECT 
    id,
    name,
    discount_percent,
    applies_to,
    start_date,
    end_date,
    is_active,
    created_at,
    updated_at
FROM discounts
WHERE name = 'Grand Opening Sale';

-- 5. Test if the discount applies to single_track specifically
SELECT '5. Testing if Grand Opening Sale applies to single_track:' as info;
SELECT 
    name,
    discount_percent,
    applies_to,
    CASE 
        WHEN 'single_track' = ANY(applies_to) THEN 'DIRECT MATCH'
        WHEN 'all' = ANY(applies_to) THEN 'ALL PRODUCTS MATCH'
        ELSE 'NO MATCH'
    END as match_type,
    CASE 
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'ACTIVE TODAY'
        ELSE 'NOT ACTIVE TODAY'
    END as date_status
FROM discounts
WHERE name = 'Grand Opening Sale';

-- 6. Test the discount calculation with different amounts
SELECT '6. Testing discount calculation with different amounts:' as info;
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

-- 7. Check RLS policies on discounts table
SELECT '7. Checking RLS policies on discounts table:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'discounts';

-- 8. Test if we can read discounts as the service role
SELECT '8. Testing discount table access:' as info;
SELECT COUNT(*) as total_discounts FROM discounts;
SELECT COUNT(*) as active_discounts FROM discounts WHERE is_active = true;
SELECT COUNT(*) as today_active_discounts FROM discounts 
WHERE is_active = true 
AND CURRENT_DATE BETWEEN start_date AND end_date; 