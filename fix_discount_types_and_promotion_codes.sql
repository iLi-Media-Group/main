-- Fix Discount Types and Promotion Codes
-- This script converts automatic discounts to promotion codes and ensures proper setup

-- ============================================
-- 1. SHOW CURRENT DISCOUNT TYPES
-- ============================================

SELECT
    'Current discount types:' as info;
SELECT
    discount_type,
    COUNT(*) as count
FROM discounts
GROUP BY discount_type
ORDER BY discount_type;

-- ============================================
-- 2. SHOW DISCOUNTS WITH 'automatic' TYPE
-- ============================================

SELECT
    'Discounts with automatic type (need to be fixed):' as info;
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
    created_at
FROM discounts
WHERE discount_type = 'automatic'
ORDER BY created_at DESC;

-- ============================================
-- 3. FIX DISCOUNT TYPES FROM 'automatic' TO 'promotion_code'
-- ============================================

-- Update all discounts to have promotion_code type
UPDATE discounts 
SET discount_type = 'promotion_code'
WHERE discount_type = 'automatic';

-- ============================================
-- 4. VERIFY THE FIX
-- ============================================

SELECT
    'Verification - Discount types after fix:' as info;
SELECT
    discount_type,
    COUNT(*) as count
FROM discounts
GROUP BY discount_type
ORDER BY discount_type;

-- ============================================
-- 5. SHOW ALL DISCOUNTS AFTER FIX
-- ============================================

SELECT
    'All discounts after fixing types:' as info;
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
    END as promotion_code_status
FROM discounts
ORDER BY created_at DESC;

-- ============================================
-- 6. SUMMARY AFTER FIX
-- ============================================

SELECT
    'Summary after fixing discount types:' as info;
SELECT
    'Total discounts' as category,
    COUNT(*) as count
FROM discounts

UNION ALL

SELECT
    'Promotion code type discounts' as category,
    COUNT(*) as count
FROM discounts
WHERE discount_type = 'promotion_code'

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