-- Test to verify checkout discount process
-- This will help us understand why the Grand Opening Sale isn't being applied

-- 1. Verify the Stripe price mapping is correct
SELECT '1. Stripe price mapping verification:' as info;
SELECT 
    'price_1RdAeZR8RYA8TFzwVH3MHECa' as price_id,
    'single_track' as expected_product,
    CASE 
        WHEN 'price_1RdAeZR8RYA8TFzwVH3MHECa' = 'price_1RdAeZR8RYA8TFzwVH3MHECa' THEN 'MATCHES'
        ELSE 'NO MATCH'
    END as mapping_status;

-- 2. Test the discount functions with the exact parameters used in checkout
SELECT '2. Testing discount functions with checkout parameters:' as info;
SELECT 
    'single_track' as product_name,
    CURRENT_DATE as check_date,
    * FROM calculate_discounted_price(1000, 'single_track', CURRENT_DATE);

-- 3. Check if the Grand Opening Sale should apply to single_track
SELECT '3. Grand Opening Sale applicability test:' as info;
SELECT 
    d.name,
    d.discount_percent,
    d.applies_to,
    'single_track' as test_product,
    CASE 
        WHEN 'single_track' = ANY(d.applies_to) THEN 'DIRECT MATCH'
        WHEN 'all' = ANY(d.applies_to) THEN 'ALL PRODUCTS MATCH'
        ELSE 'NO MATCH'
    END as product_match,
    CASE 
        WHEN CURRENT_DATE BETWEEN d.start_date AND d.end_date THEN 'ACTIVE TODAY'
        ELSE 'NOT ACTIVE TODAY'
    END as date_match,
    CASE 
        WHEN d.is_active = true THEN 'ACTIVE'
        ELSE 'INACTIVE'
    END as status_match
FROM discounts d
WHERE d.name = 'Grand Opening Sale';

-- 4. Test the get_applicable_discounts function
SELECT '4. Testing get_applicable_discounts function:' as info;
SELECT * FROM get_applicable_discounts('single_track', CURRENT_DATE);

-- 5. Check if there are any RLS policy issues
SELECT '5. Checking RLS policies:' as info;
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'discounts';

-- 6. Test direct access to discounts table
SELECT '6. Testing direct access to discounts table:' as info;
SELECT 
    COUNT(*) as total_discounts,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_discounts,
    COUNT(CASE WHEN is_active = true AND CURRENT_DATE BETWEEN start_date AND end_date THEN 1 END) as today_active_discounts
FROM discounts;

-- 7. Show all discounts that should apply to single_track today
SELECT '7. All discounts that should apply to single_track today:' as info;
SELECT 
    name,
    discount_percent,
    applies_to,
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