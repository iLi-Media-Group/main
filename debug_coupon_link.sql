-- Debug the coupon linkage issue

-- Check the TEST30 discount
SELECT 'TEST30 Discount Details:' as info;
SELECT 
    id,
    name,
    discount_type,
    promotion_code,
    discount_percent,
    stripe_coupon_id,
    stripe_coupon_created_at,
    created_at
FROM discounts
WHERE promotion_code = 'TEST30'
ORDER BY created_at DESC;

-- Check all promotion code discounts
SELECT 'All Promotion Code Discounts:' as info;
SELECT 
    id,
    name,
    promotion_code,
    stripe_coupon_id,
    stripe_coupon_created_at
FROM discounts
WHERE discount_type = 'promotion_code'
ORDER BY created_at DESC;

-- Check if there are any discounts without Stripe coupons
SELECT 'Discounts Missing Stripe Coupons:' as info;
SELECT 
    id,
    name,
    promotion_code,
    stripe_coupon_id
FROM discounts
WHERE discount_type = 'promotion_code' 
  AND (stripe_coupon_id IS NULL OR stripe_coupon_id = '')
ORDER BY created_at DESC; 