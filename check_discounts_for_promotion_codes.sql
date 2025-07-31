-- Check Discounts for Promotion Codes
-- This script identifies which discounts need promotion codes added

-- ============================================
-- 1. SHOW ALL DISCOUNTS WITH PROMOTION CODE STATUS
-- ============================================

SELECT
    'All discounts with promotion code status:' as info;
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
    created_at,
    CASE
        WHEN promotion_code IS NULL THEN '❌ MISSING PROMOTION CODE'
        WHEN promotion_code = '' THEN '❌ EMPTY PROMOTION CODE'
        ELSE '✅ HAS PROMOTION CODE'
    END as promotion_code_status,
    CASE
        WHEN discount_type = 'promotion_code' THEN '✅ PROMOTION CODE TYPE'
        ELSE '❌ AUTOMATIC DISCOUNT'
    END as discount_type_status
FROM discounts
ORDER BY created_at DESC;

-- ============================================
-- 2. DISCOUNTS THAT NEED PROMOTION CODES
-- ============================================

SELECT
    'Discounts that need promotion codes:' as info;
SELECT
    id,
    name,
    description,
    discount_percent,
    discount_type,
    applies_to,
    is_active,
    start_date,
    end_date,
    CASE
        WHEN promotion_code IS NULL THEN '❌ NULL'
        WHEN promotion_code = '' THEN '❌ EMPTY'
        ELSE '✅ HAS CODE'
    END as promotion_code_status
FROM discounts
WHERE promotion_code IS NULL OR promotion_code = ''
ORDER BY created_at DESC;

-- ============================================
-- 3. DISCOUNTS WITH PROMOTION CODES
-- ============================================

SELECT
    'Discounts with promotion codes:' as info;
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
    CASE
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN '✅ ACTIVE TODAY'
        WHEN CURRENT_DATE < start_date THEN '⏳ NOT YET STARTED'
        WHEN CURRENT_DATE > end_date THEN '❌ EXPIRED'
        ELSE '❓ UNKNOWN'
    END as date_status
FROM discounts
WHERE promotion_code IS NOT NULL AND promotion_code != ''
ORDER BY created_at DESC;

-- ============================================
-- 4. SUMMARY
-- ============================================

SELECT
    'Summary:' as info;
SELECT
    'Total discounts' as category,
    COUNT(*) as count
FROM discounts

UNION ALL

SELECT
    'Discounts with promotion codes' as category,
    COUNT(*) as count
FROM discounts
WHERE promotion_code IS NOT NULL AND promotion_code != ''

UNION ALL

SELECT
    'Discounts missing promotion codes' as category,
    COUNT(*) as count
FROM discounts
WHERE promotion_code IS NULL OR promotion_code = ''

UNION ALL

SELECT
    'Active promotion codes today' as category,
    COUNT(*) as count
FROM discounts
WHERE promotion_code IS NOT NULL 
AND promotion_code != ''
AND discount_type = 'promotion_code'
AND is_active = true
AND CURRENT_DATE BETWEEN start_date AND end_date; 