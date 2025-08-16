-- Test date handling for Edge Function

-- Check the test discount that was created
SELECT 'Test discount details:' as info;
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
WHERE promotion_code = 'TEST15'
   OR name LIKE '%End-to-End%'
   OR name LIKE '%TEST15%';

-- Test date conversion (similar to what the Edge Function does)
SELECT 'Testing date conversion:' as info;
SELECT 
    'Current date' as test_type,
    CURRENT_DATE as date_value,
    EXTRACT(EPOCH FROM CURRENT_DATE) as epoch_seconds;

-- Test with a specific end date
SELECT 'Testing with end date:' as info;
SELECT 
    'End date from discount' as test_type,
    end_date as date_value,
    CASE 
        WHEN end_date IS NOT NULL THEN EXTRACT(EPOCH FROM end_date::date)
        ELSE NULL
    END as epoch_seconds
FROM discounts
WHERE promotion_code = 'TEST15'
   OR name LIKE '%End-to-End%'
   OR name LIKE '%TEST15%'
LIMIT 1; 