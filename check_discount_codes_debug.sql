-- Debug Discount Codes
-- This script checks what discount codes exist and why they might not be showing up

-- ============================================
-- 1. CHECK ALL DISCOUNTS
-- ============================================

-- Show all discounts in the database
SELECT
    'All discounts in database:' as info;
SELECT
    id,
    name,
    description,
    promotion_code,
    discount_percent,
    discount_type,
    is_active,
    start_date,
    end_date,
    created_at
FROM discounts
ORDER BY created_at DESC;

-- ============================================
-- 2. CHECK PROMOTION CODE DISCOUNTS
-- ============================================

-- Show only promotion code discounts
SELECT
    'Promotion code discounts:' as info;
SELECT
    id,
    name,
    description,
    promotion_code,
    discount_percent,
    is_active,
    start_date,
    end_date,
    CASE
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN '✅ ACTIVE TODAY'
        WHEN CURRENT_DATE < start_date THEN '⏳ NOT YET STARTED'
        WHEN CURRENT_DATE > end_date THEN '❌ EXPIRED'
        ELSE '❓ UNKNOWN'
    END as status
FROM discounts
WHERE discount_type = 'promotion_code'
ORDER BY created_at DESC;

-- ============================================
-- 3. CHECK ACTIVE PROMOTION CODES
-- ============================================

-- Show active promotion codes that should appear on dashboard
SELECT
    'Active promotion codes for dashboard:' as info;
SELECT
    id,
    name,
    description,
    promotion_code,
    discount_percent,
    is_active,
    start_date,
    end_date,
    CASE
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN '✅ ACTIVE TODAY'
        WHEN CURRENT_DATE < start_date THEN '⏳ NOT YET STARTED'
        WHEN CURRENT_DATE > end_date THEN '❌ EXPIRED'
        ELSE '❓ UNKNOWN'
    END as status
FROM discounts
WHERE discount_type = 'promotion_code'
AND is_active = true
AND CURRENT_DATE BETWEEN start_date AND end_date
ORDER BY created_at DESC;

-- ============================================
-- 4. CHECK DATE RANGES
-- ============================================

-- Show current date and date ranges
SELECT
    'Date information:' as info;
SELECT
    'Current date' as item,
    CURRENT_DATE as value

UNION ALL

SELECT
    'Current timestamp' as item,
    NOW()::text as value

UNION ALL

SELECT
    'ISO date string' as item,
    CURRENT_DATE::text as value;

-- ============================================
-- 5. SUMMARY
-- ============================================

-- Show summary counts
SELECT
    'Summary:' as info;
SELECT
    'Total discounts' as category,
    COUNT(*) as count
FROM discounts

UNION ALL

SELECT
    'Promotion code discounts' as category,
    COUNT(*) as count
FROM discounts
WHERE discount_type = 'promotion_code'

UNION ALL

SELECT
    'Active promotion codes' as category,
    COUNT(*) as count
FROM discounts
WHERE discount_type = 'promotion_code'
AND is_active = true
AND CURRENT_DATE BETWEEN start_date AND end_date; 