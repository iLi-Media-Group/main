-- Check all discounts in the database

-- Check all discounts
SELECT 'All discounts in database:' as info;
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
ORDER BY created_at DESC;

-- Check promotion code discounts specifically
SELECT 'Promotion code discounts:' as info;
SELECT 
    id,
    name,
    promotion_code,
    discount_percent,
    stripe_coupon_id,
    stripe_coupon_created_at
FROM discounts
WHERE discount_type = 'promotion_code'
ORDER BY created_at DESC;

-- Check automatic discounts
SELECT 'Automatic discounts:' as info;
SELECT 
    id,
    name,
    discount_type,
    discount_percent,
    stripe_coupon_id,
    stripe_coupon_created_at
FROM discounts
WHERE discount_type = 'automatic'
ORDER BY created_at DESC; 