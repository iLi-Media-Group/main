-- Debug Admin Dashboard Discounts
-- This script checks why the admin dashboard is only showing 2 discounts

-- ============================================
-- 1. CHECK ALL DISCOUNTS (WHAT THE ADMIN DASHBOARD SHOULD SEE)
-- ============================================

SELECT
    'All discounts that should appear in admin dashboard:' as info;
SELECT
    id,
    name,
    description,
    promotion_code,
    discount_percent,
    discount_type,
    applies_to,
    is_active,
    start_date,
    end_date,
    stripe_coupon_id,
    stripe_coupon_created_at,
    created_at,
    updated_at
FROM discounts
ORDER BY created_at DESC;

-- ============================================
-- 2. CHECK DISCOUNTS BY STATUS
-- ============================================

SELECT
    'Discounts by active status:' as info;
SELECT
    is_active,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as discount_names
FROM discounts
GROUP BY is_active
ORDER BY is_active DESC;

-- ============================================
-- 3. CHECK DISCOUNTS BY DATE STATUS
-- ============================================

SELECT
    'Discounts by date status:' as info;
SELECT
    CASE
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'ACTIVE TODAY'
        WHEN CURRENT_DATE < start_date THEN 'NOT YET STARTED'
        WHEN CURRENT_DATE > end_date THEN 'EXPIRED'
        ELSE 'UNKNOWN'
    END as date_status,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as discount_names
FROM discounts
GROUP BY 
    CASE
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'ACTIVE TODAY'
        WHEN CURRENT_DATE < start_date THEN 'NOT YET STARTED'
        WHEN CURRENT_DATE > end_date THEN 'EXPIRED'
        ELSE 'UNKNOWN'
    END
ORDER BY date_status;

-- ============================================
-- 4. CHECK STRIPE COUPON STATUS
-- ============================================

SELECT
    'Stripe coupon status:' as info;
SELECT
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
-- 5. SUMMARY FOR ADMIN DASHBOARD
-- ============================================

SELECT
    'Summary for admin dashboard:' as info;
SELECT
    'Total discounts in database' as category,
    COUNT(*) as count
FROM discounts

UNION ALL

SELECT
    'Active discounts' as category,
    COUNT(*) as count
FROM discounts
WHERE is_active = true

UNION ALL

SELECT
    'Active today' as category,
    COUNT(*) as count
FROM discounts
WHERE CURRENT_DATE BETWEEN start_date AND end_date

UNION ALL

SELECT
    'Promotion code discounts' as category,
    COUNT(*) as count
FROM discounts
WHERE discount_type = 'promotion_code'

UNION ALL

SELECT
    'Discounts with Stripe coupons' as category,
    COUNT(*) as count
FROM discounts
WHERE stripe_coupon_id IS NOT NULL; 