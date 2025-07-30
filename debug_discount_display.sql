-- Debug Discount Display Issue
-- This script checks why only one discount is showing on the client dashboard

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
    applies_to,
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
    discount_type,
    applies_to,
    is_active,
    start_date,
    end_date,
    created_at
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
WHERE discount_type = 'promotion_code'
AND is_active = true
AND promotion_code IS NOT NULL
ORDER BY created_at DESC;

-- ============================================
-- 4. CHECK DATE FILTERING
-- ============================================

-- Show current date and check date filtering
SELECT
    'Date filtering check:' as info;
SELECT
    'Current date' as item,
    CURRENT_DATE::text as value

UNION ALL

SELECT
    'Current timestamp' as item,
    NOW()::text as value

UNION ALL

SELECT
    'ISO date string' as item,
    CURRENT_DATE::text as value;

-- ============================================
-- 5. CHECK EACH DISCOUNT'S STATUS
-- ============================================

-- Detailed status check for each discount
SELECT
    'Detailed discount status:' as info;
SELECT
    id,
    name,
    promotion_code,
    discount_type,
    is_active,
    start_date,
    end_date,
    CASE
        WHEN discount_type != 'promotion_code' THEN '❌ NOT PROMOTION CODE'
        WHEN promotion_code IS NULL THEN '❌ NO PROMOTION CODE'
        WHEN is_active = false THEN '❌ NOT ACTIVE'
        WHEN CURRENT_DATE < start_date THEN '⏳ NOT YET STARTED'
        WHEN CURRENT_DATE > end_date THEN '❌ EXPIRED'
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN '✅ SHOULD SHOW'
        ELSE '❓ UNKNOWN'
    END as display_status,
    CASE
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN '✅ ACTIVE TODAY'
        WHEN CURRENT_DATE < start_date THEN '⏳ NOT YET STARTED'
        WHEN CURRENT_DATE > end_date THEN '❌ EXPIRED'
        ELSE '❓ UNKNOWN'
    END as date_status
FROM discounts
ORDER BY created_at DESC;

-- ============================================
-- 6. SUMMARY
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
AND promotion_code IS NOT NULL
AND CURRENT_DATE BETWEEN start_date AND end_date; 