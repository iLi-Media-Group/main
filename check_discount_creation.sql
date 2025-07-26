-- Check if the discount was created successfully
SELECT 'All discounts in database:' as info;
SELECT 
    id,
    name,
    discount_percent,
    applies_to,
    discount_type,
    promotion_code,
    is_automatic,
    stripe_coupon_id,
    stripe_coupon_created_at,
    is_active,
    start_date,
    end_date,
    CASE 
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'ACTIVE TODAY'
        ELSE 'NOT ACTIVE TODAY'
    END as date_status
FROM discounts
ORDER BY created_at DESC;

-- Check if any promotion code discounts exist
SELECT 'Promotion code discounts:' as info;
SELECT 
    name,
    promotion_code,
    discount_percent,
    stripe_coupon_id,
    stripe_coupon_created_at,
    CASE 
        WHEN stripe_coupon_id IS NOT NULL THEN '✅ Stripe Coupon Created'
        WHEN discount_type = 'promotion_code' AND promotion_code IS NOT NULL THEN '⚠️ Needs Stripe Coupon'
        ELSE 'ℹ️ Not Applicable'
    END as stripe_status
FROM discounts
WHERE discount_type = 'promotion_code';

-- Test the discount functions
SELECT 'Testing discount functions:' as info;
SELECT * FROM get_applicable_discounts('single_track', CURRENT_DATE);

-- Test with a specific promotion code (replace 'YOUR_CODE' with the actual code)
-- SELECT 'Testing specific promotion code:' as info;
-- SELECT * FROM validate_promotion_code('YOUR_CODE', 'single_track', CURRENT_DATE); 