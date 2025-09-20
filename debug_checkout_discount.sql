-- Debug script to check checkout discount process
-- This will help us understand why the discount isn't being applied

-- 1. Check if the discount functions exist and are working
SELECT '1. Checking discount functions:' as info;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('get_applicable_discounts', 'calculate_discounted_price')
AND routine_schema = 'public';

-- 2. Check the Grand Opening Sale discount specifically
SELECT '2. Grand Opening Sale discount details:' as info;
SELECT 
    id,
    name,
    discount_percent,
    applies_to,
    discount_type,
    is_automatic,
    start_date,
    end_date,
    is_active,
    created_at,
    updated_at
FROM discounts
WHERE name = 'Grand Opening Sale';

-- 3. Test if the discount should apply to single_track
SELECT '3. Testing Grand Opening Sale applicability:' as info;
SELECT 
    name,
    discount_percent,
    applies_to,
    discount_type,
    is_automatic,
    CASE 
        WHEN 'single_track' = ANY(applies_to) THEN 'DIRECT MATCH'
        WHEN 'all' = ANY(applies_to) THEN 'ALL PRODUCTS MATCH'
        ELSE 'NO MATCH'
    END as product_match,
    CASE 
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'ACTIVE TODAY'
        ELSE 'NOT ACTIVE TODAY'
    END as date_match,
    CASE 
        WHEN is_active = true THEN 'ACTIVE'
        ELSE 'INACTIVE'
    END as status_match
FROM discounts
WHERE name = 'Grand Opening Sale';

-- 4. Test the get_applicable_discounts function directly
SELECT '4. Testing get_applicable_discounts function:' as info;
SELECT * FROM get_applicable_discounts('single_track', CURRENT_DATE);

-- 5. Test the calculate_discounted_price function directly
SELECT '5. Testing calculate_discounted_price function:' as info;
SELECT * FROM calculate_discounted_price(1000, 'single_track', CURRENT_DATE);

-- 6. Check if there are any RLS policy issues
SELECT '6. Checking RLS policies on discounts table:' as info;
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'discounts';

-- 7. Test direct access to discounts table
SELECT '7. Testing direct access to discounts table:' as info;
SELECT COUNT(*) as total_discounts FROM discounts;
SELECT COUNT(*) as active_discounts FROM discounts WHERE is_active = true;
SELECT COUNT(*) as today_active_discounts FROM discounts 
WHERE is_active = true 
AND CURRENT_DATE BETWEEN start_date AND end_date;

-- 8. Check all discounts that should apply to single_track today
SELECT '8. All discounts that should apply to single_track today:' as info;
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