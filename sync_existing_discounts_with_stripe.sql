-- Sync Existing Discounts with Stripe
-- This script will create Stripe coupons for existing promotion code discounts

-- ============================================
-- 1. CHECK EXISTING PROMOTION CODE DISCOUNTS
-- ============================================

-- Show existing promotion code discounts that need Stripe integration
SELECT
    'Existing promotion code discounts:' as info;
SELECT
    id,
    name,
    description,
    promotion_code,
    discount_percent,
    discount_type,
    stripe_coupon_id,
    stripe_promotion_code_id,
    is_active,
    start_date,
    end_date
FROM discounts
WHERE discount_type = 'promotion_code'
AND promotion_code IS NOT NULL
ORDER BY created_at DESC;

-- ============================================
-- 2. CHECK WHICH DISCOUNTS NEED STRIPE COUPONS
-- ============================================

-- Show discounts that need Stripe coupons created
SELECT
    'Discounts needing Stripe coupons:' as info;
SELECT
    id,
    name,
    promotion_code,
    discount_percent,
    CASE 
        WHEN stripe_coupon_id IS NULL THEN 'NEEDS COUPON'
        ELSE 'HAS COUPON'
    END as coupon_status,
    CASE 
        WHEN stripe_promotion_code_id IS NULL THEN 'NEEDS PROMOTION CODE'
        ELSE 'HAS PROMOTION CODE'
    END as promotion_code_status
FROM discounts
WHERE discount_type = 'promotion_code'
AND promotion_code IS NOT NULL
ORDER BY created_at DESC;

-- ============================================
-- 3. INSTRUCTIONS FOR MANUAL STRIPE CREATION
-- ============================================

-- For each discount that needs a Stripe coupon, provide instructions
SELECT
    'Instructions to create Stripe coupons manually:' as info;
SELECT
    'For discount: ' || name as discount_name,
    'Promotion code: ' || promotion_code as code,
    'Discount percent: ' || discount_percent || '%' as percent,
    'Steps:' as steps,
    '1. Go to https://dashboard.stripe.com/coupons' as step1,
    '2. Click "Create coupon"' as step2,
    '3. Set coupon ID to: ' || promotion_code as step3,
    '4. Set name to: ' || name as step4,
    '5. Set percent off to: ' || discount_percent || '%' as step5,
    '6. Set duration to: once' as step6,
    '7. Set redeem by to: ' || end_date as step7,
    '8. Save the coupon' as step8,
    '9. Then create promotion code with code: ' || promotion_code as step9
FROM discounts
WHERE discount_type = 'promotion_code'
AND promotion_code IS NOT NULL
AND stripe_coupon_id IS NULL
ORDER BY created_at DESC;

-- ============================================
-- 4. UPDATE EXISTING DISCOUNT WITH STRIPE INFO
-- ============================================

-- This section will be used after you create the Stripe coupons manually
-- You'll need to update the stripe_coupon_id and stripe_promotion_code_id

-- Example for WELCOME20 (replace with actual Stripe IDs):
-- UPDATE discounts 
-- SET stripe_coupon_id = 'WELCOME20',
--     stripe_promotion_code_id = 'promo_WELCOME20',
--     stripe_coupon_created_at = NOW(),
--     stripe_promotion_code_created_at = NOW()
-- WHERE promotion_code = 'WELCOME20';

-- ============================================
-- 5. VERIFY STRIPE INTEGRATION
-- ============================================

-- After creating Stripe coupons, verify the integration
SELECT
    'Verification - All promotion code discounts:' as info;
SELECT
    id,
    name,
    promotion_code,
    discount_percent,
    stripe_coupon_id,
    stripe_promotion_code_id,
    CASE 
        WHEN stripe_coupon_id IS NOT NULL AND stripe_promotion_code_id IS NOT NULL 
        THEN '✅ FULLY INTEGRATED'
        WHEN stripe_coupon_id IS NOT NULL 
        THEN '⚠️ HAS COUPON, NEEDS PROMOTION CODE'
        ELSE '❌ NEEDS STRIPE INTEGRATION'
    END as integration_status
FROM discounts
WHERE discount_type = 'promotion_code'
AND promotion_code IS NOT NULL
ORDER BY created_at DESC; 