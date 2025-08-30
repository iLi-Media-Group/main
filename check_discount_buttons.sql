-- Check why Create Stripe Coupon buttons aren't appearing

-- Check all discounts and their Stripe coupon status
SELECT 'All discounts and their Stripe coupon status:' as info;
SELECT 
    id,
    name,
    discount_type,
    promotion_code,
    discount_percent,
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
ORDER BY created_at DESC;

-- Check specifically for promotion code discounts
SELECT 'Promotion code discounts that should show buttons:' as info;
SELECT 
    id,
    name,
    promotion_code,
    discount_percent,
    stripe_coupon_id,
    stripe_coupon_created_at,
    CASE 
        WHEN stripe_coupon_id IS NULL THEN 'SHOULD SHOW BUTTON'
        ELSE 'SHOULD NOT SHOW BUTTON (already created)'
    END as button_should_show
FROM discounts
WHERE discount_type = 'promotion_code'
ORDER BY created_at DESC; 