-- Check All Discount-Related Tables
-- This script finds all tables that might contain discount information

-- ============================================
-- 1. FIND ALL TABLES WITH "DISCOUNT" IN NAME
-- ============================================

-- Show all tables that contain "discount" in the name
SELECT
    'Tables with "discount" in name:' as info;
SELECT
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name ILIKE '%discount%'
ORDER BY table_name;

-- ============================================
-- 2. FIND ALL TABLES WITH "PROMOTION" IN NAME
-- ============================================

-- Show all tables that contain "promotion" in the name
SELECT
    'Tables with "promotion" in name:' as info;
SELECT
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name ILIKE '%promotion%'
ORDER BY table_name;

-- ============================================
-- 3. FIND ALL TABLES WITH "COUPON" IN NAME
-- ============================================

-- Show all tables that contain "coupon" in the name
SELECT
    'Tables with "coupon" in name:' as info;
SELECT
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name ILIKE '%coupon%'
ORDER BY table_name;

-- ============================================
-- 4. CHECK ALL TABLES FOR DISCOUNT-RELATED COLUMNS
-- ============================================

-- Show all tables that have columns with "discount" in the name
SELECT
    'Tables with discount-related columns:' as info;
SELECT DISTINCT
    t.table_name,
    c.column_name
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND c.column_name ILIKE '%discount%'
ORDER BY t.table_name, c.column_name;

-- ============================================
-- 5. CHECK ALL TABLES FOR PROMOTION-RELATED COLUMNS
-- ============================================

-- Show all tables that have columns with "promotion" in the name
SELECT
    'Tables with promotion-related columns:' as info;
SELECT DISTINCT
    t.table_name,
    c.column_name
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND c.column_name ILIKE '%promotion%'
ORDER BY t.table_name, c.column_name; 