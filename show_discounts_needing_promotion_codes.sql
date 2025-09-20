-- Show Discounts Needing Promotion Codes
-- This script shows the 4 discounts that need promotion codes added

-- ============================================
-- 1. DISCOUNTS MISSING PROMOTION CODES
-- ============================================

SELECT
    'Discounts that need promotion codes added:' as info;
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
    created_at,
    CASE
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN '✅ ACTIVE TODAY'
        WHEN CURRENT_DATE < start_date THEN '⏳ NOT YET STARTED'
        WHEN CURRENT_DATE > end_date THEN '❌ EXPIRED'
        ELSE '❓ UNKNOWN'
    END as date_status
FROM discounts
WHERE promotion_code IS NULL OR promotion_code = ''
ORDER BY created_at DESC;

-- ============================================
-- 2. DISCOUNTS WITH PROMOTION CODES (FOR REFERENCE)
-- ============================================

SELECT
    'Discounts that already have promotion codes:' as info;
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
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN '✅ ACTIVE TODAY'
        WHEN CURRENT_DATE < start_date THEN '⏳ NOT YET STARTED'
        WHEN CURRENT_DATE > end_date THEN '❌ EXPIRED'
        ELSE '❓ UNKNOWN'
    END as date_status
FROM discounts
WHERE promotion_code IS NOT NULL AND promotion_code != ''
ORDER BY created_at DESC;

-- ============================================
-- 3. SUMMARY
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