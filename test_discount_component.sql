-- Test to verify the frontend can read the new columns

-- Check if the columns are accessible via RLS
SELECT 'Testing frontend access to new columns:' as info;
SELECT 
    id,
    name,
    discount_type,
    promotion_code,
    stripe_coupon_id,
    stripe_coupon_created_at
FROM discounts
WHERE discount_type = 'promotion_code'
ORDER BY created_at DESC;

-- Test the specific WELCOME10 discount
SELECT 'WELCOME10 discount details:' as info;
SELECT 
    id,
    name,
    discount_type,
    promotion_code,
    stripe_coupon_id,
    stripe_coupon_created_at,
    CASE 
        WHEN discount_type = 'promotion_code' AND stripe_coupon_id IS NULL THEN 'SHOULD SHOW BUTTON'
        WHEN discount_type = 'promotion_code' AND stripe_coupon_id IS NOT NULL THEN 'SHOULD NOT SHOW BUTTON'
        ELSE 'NOT APPLICABLE'
    END as button_logic
FROM discounts
WHERE promotion_code = 'WELCOME10'; 