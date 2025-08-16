-- Test the calculate_discounted_price function directly
SELECT 'Testing calculate_discounted_price function:' as info;
SELECT * FROM calculate_discounted_price(999, 'single_track', CURRENT_DATE);

-- Check if the Grand Opening Sale discount exists and is active
SELECT 'Checking Grand Opening Sale discount:' as info;
SELECT 
    name,
    discount_percent,
    applies_to,
    discount_type,
    is_automatic,
    start_date,
    end_date,
    CASE 
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'ACTIVE TODAY'
        ELSE 'NOT ACTIVE TODAY'
    END as date_status
FROM discounts
WHERE name = 'Grand Opening Sale';

-- Test get_applicable_discounts function
SELECT 'Testing get_applicable_discounts function:' as info;
SELECT * FROM get_applicable_discounts('single_track', CURRENT_DATE); 