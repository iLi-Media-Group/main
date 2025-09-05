-- Fix the WELCOME10 discount to have the correct promotion code

-- First, let's see the current state
SELECT 'Current WELCOME10 discount state:' as info;
SELECT 
    id,
    name,
    discount_type,
    promotion_code,
    stripe_coupon_id,
    stripe_coupon_created_at,
    is_active,
    start_date,
    end_date
FROM discounts
WHERE promotion_code = 'WELCOME10' OR name LIKE '%WELCOME10%';

-- Update the WELCOME10 discount to have the correct promotion code
UPDATE discounts 
SET promotion_code = 'WELCOME10'
WHERE id = '66b2ba03-413f-4b07-91eb-e13e05763ef1'
AND discount_type = 'promotion_code';

-- Verify the fix
SELECT 'After fix - WELCOME10 discount state:' as info;
SELECT 
    id,
    name,
    discount_type,
    promotion_code,
    stripe_coupon_id,
    stripe_coupon_created_at,
    is_active,
    start_date,
    end_date,
    CASE 
        WHEN discount_type = 'promotion_code' AND stripe_coupon_id IS NULL THEN '⚠️ Needs Stripe Coupon Button'
        WHEN discount_type = 'promotion_code' AND stripe_coupon_id IS NOT NULL THEN '✅ Stripe Coupon Created'
        WHEN discount_type = 'automatic' THEN 'ℹ️ Automatic (No Button)'
        ELSE '❓ Unknown'
    END as button_status
FROM discounts
WHERE id = '66b2ba03-413f-4b07-91eb-e13e05763ef1';

-- Show all promotion code discounts
SELECT 'All promotion code discounts:' as info;
SELECT 
    id,
    name,
    discount_type,
    promotion_code,
    stripe_coupon_id,
    stripe_coupon_created_at,
    CASE 
        WHEN stripe_coupon_id IS NULL THEN 'SHOULD SHOW BUTTON'
        ELSE 'SHOULD NOT SHOW BUTTON (already created)'
    END as button_should_show
FROM discounts
WHERE discount_type = 'promotion_code'
ORDER BY created_at DESC; 