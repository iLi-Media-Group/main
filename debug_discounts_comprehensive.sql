-- Comprehensive debug script to check all discounts

-- 1. Check all discounts in the database
SELECT '1. All discounts in database:' as info;
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
    created_at
FROM discounts
ORDER BY created_at DESC;

-- 2. Check specifically for WELCOME10
SELECT '2. Searching for WELCOME10 discount:' as info;
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
    end_date
FROM discounts
WHERE promotion_code = 'WELCOME10' 
   OR name LIKE '%WELCOME10%'
   OR name LIKE '%WELCOME%';

-- 3. Check all promotion code discounts
SELECT '3. All promotion code discounts:' as info;
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
    end_date
FROM discounts
WHERE discount_type = 'promotion_code';

-- 4. Check if any discounts have null promotion codes
SELECT '4. Discounts with null promotion codes:' as info;
SELECT 
    id,
    name,
    discount_type,
    promotion_code,
    discount_percent
FROM discounts
WHERE discount_type = 'promotion_code' 
   AND promotion_code IS NULL;

-- 5. Check the total count of discounts
SELECT '5. Discount counts:' as info;
SELECT 
    COUNT(*) as total_discounts,
    COUNT(CASE WHEN discount_type = 'promotion_code' THEN 1 END) as promotion_code_discounts,
    COUNT(CASE WHEN discount_type = 'automatic' THEN 1 END) as automatic_discounts,
    COUNT(CASE WHEN stripe_coupon_id IS NOT NULL THEN 1 END) as discounts_with_stripe_coupons
FROM discounts; 