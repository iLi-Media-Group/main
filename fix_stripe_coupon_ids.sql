-- Fix Stripe Coupon IDs
-- This script fixes Stripe coupon IDs for discounts that have promotion codes

-- ============================================
-- 1. SHOW DISCOUNTS WITH PROMOTION CODES BUT NO STRIPE COUPON ID
-- ============================================

SELECT
    'Discounts with promotion codes but no Stripe coupon ID:' as info;
SELECT
    id,
    name,
    promotion_code,
    stripe_coupon_id,
    stripe_coupon_created_at,
    created_at
FROM discounts
WHERE promotion_code IS NOT NULL 
AND promotion_code != ''
AND stripe_coupon_id IS NULL
ORDER BY created_at DESC;

-- ============================================
-- 2. SHOW DISCOUNTS WITH STRIPE COUPON IDS
-- ============================================

SELECT
    'Discounts with Stripe coupon IDs:' as info;
SELECT
    id,
    name,
    promotion_code,
    stripe_coupon_id,
    stripe_coupon_created_at,
    created_at
FROM discounts
WHERE stripe_coupon_id IS NOT NULL
ORDER BY created_at DESC;

-- ============================================
-- 3. UPDATE STRIPE COUPON IDS (EXAMPLE)
-- ============================================

-- For discounts that have promotion codes but no stripe_coupon_id,
-- you would need to update them with the actual Stripe coupon IDs
-- from your Stripe dashboard.

-- Example updates (replace with actual Stripe coupon IDs):
-- UPDATE discounts 
-- SET stripe_coupon_id = 'your_stripe_coupon_id_here',
--     stripe_coupon_created_at = NOW()
-- WHERE id = 'your_discount_id_here' 
-- AND promotion_code IS NOT NULL 
-- AND stripe_coupon_id IS NULL;

-- ============================================
-- 4. VERIFICATION AFTER FIX
-- ============================================

SELECT
    'Verification - All promotion code discounts:' as info;
SELECT
    id,
    name,
    promotion_code,
    stripe_coupon_id,
    stripe_coupon_created_at,
    CASE
        WHEN stripe_coupon_id IS NOT NULL THEN '✅ HAS STRIPE COUPON'
        ELSE '❌ NO STRIPE COUPON'
    END as stripe_status
FROM discounts
WHERE discount_type = 'promotion_code'
ORDER BY created_at DESC;

-- ============================================
-- 5. SUMMARY
-- ============================================

SELECT
    'Summary:' as info;
SELECT
    'Total promotion code discounts' as category,
    COUNT(*) as count
FROM discounts
WHERE discount_type = 'promotion_code'

UNION ALL

SELECT
    'Promotion codes with Stripe coupons' as category,
    COUNT(*) as count
FROM discounts
WHERE discount_type = 'promotion_code'
AND stripe_coupon_id IS NOT NULL

UNION ALL

SELECT
    'Promotion codes missing Stripe coupons' as category,
    COUNT(*) as count
FROM discounts
WHERE discount_type = 'promotion_code'
AND stripe_coupon_id IS NULL; 