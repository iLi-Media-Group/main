-- Simple test to verify discount functions are working

-- 1. Check if the Grand Opening Sale exists and is configured correctly
SELECT '1. Grand Opening Sale details:' as info;
SELECT 
    name,
    discount_percent,
    applies_to,
    discount_type,
    is_automatic,
    start_date,
    end_date,
    is_active
FROM discounts
WHERE name = 'Grand Opening Sale';

-- 2. Test if the discount should apply to single_track today
SELECT '2. Testing if Grand Opening Sale applies to single_track:' as info;
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

-- 3. Test the get_applicable_discounts function
SELECT '3. Testing get_applicable_discounts function:' as info;
SELECT * FROM get_applicable_discounts('single_track', CURRENT_DATE);

-- 4. Test the calculate_discounted_price function
SELECT '4. Testing calculate_discounted_price function:' as info;
SELECT * FROM calculate_discounted_price(1000, 'single_track', CURRENT_DATE);

-- 5. Test with a $10.00 price (1000 cents)
SELECT '5. Testing discount calculation for $10.00:' as info;
SELECT 
    original_price,
    discount_percent,
    discounted_price,
    discount_name,
    discount_description,
    discount_type
FROM calculate_discounted_price(1000, 'single_track', CURRENT_DATE); 