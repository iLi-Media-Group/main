-- Test script to verify discount functions are working correctly
-- This will help us debug why discounts aren't being applied

-- Check if discounts table exists and has data
SELECT 'Checking discounts table:' as info;
SELECT 
    id,
    name,
    discount_percent,
    applies_to,
    start_date,
    end_date,
    is_active,
    created_at
FROM discounts
ORDER BY created_at DESC;

-- Test the get_applicable_discounts function
SELECT 'Testing get_applicable_discounts function:' as info;
SELECT * FROM get_applicable_discounts('single_track', CURRENT_DATE);

-- Test the calculate_discounted_price function
SELECT 'Testing calculate_discounted_price function:' as info;
SELECT * FROM calculate_discounted_price(1000, 'single_track', CURRENT_DATE);

-- Test with different products
SELECT 'Testing discounts for different products:' as info;
SELECT 
    'single_track' as product,
    * FROM calculate_discounted_price(1000, 'single_track', CURRENT_DATE)
UNION ALL
SELECT 
    'gold_access' as product,
    * FROM calculate_discounted_price(2000, 'gold_access', CURRENT_DATE)
UNION ALL
SELECT 
    'starter' as product,
    * FROM calculate_discounted_price(5000, 'starter', CURRENT_DATE);

-- Check if any discounts are active today
SELECT 'Active discounts today:' as info;
SELECT 
    name,
    discount_percent,
    applies_to,
    start_date,
    end_date,
    is_active
FROM discounts
WHERE is_active = true
AND CURRENT_DATE BETWEEN start_date AND end_date
ORDER BY discount_percent DESC;

-- Check discount application for specific products
SELECT 'Testing discount application for single_track:' as info;
SELECT 
    d.name as discount_name,
    d.discount_percent,
    d.applies_to,
    CASE 
        WHEN 'single_track' = ANY(d.applies_to) THEN 'YES'
        WHEN 'all' = ANY(d.applies_to) THEN 'YES'
        ELSE 'NO'
    END as applies_to_single_track
FROM discounts d
WHERE d.is_active = true
AND CURRENT_DATE BETWEEN d.start_date AND d.end_date; 