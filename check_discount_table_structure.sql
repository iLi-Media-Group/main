-- Check Discounts Table Structure
-- This script checks what columns actually exist in the discounts table

-- ============================================
-- 1. CHECK TABLE STRUCTURE
-- ============================================

-- Show all columns in the discounts table
SELECT
    'Discounts table structure:' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'discounts'
ORDER BY ordinal_position;

-- ============================================
-- 2. CHECK SAMPLE DATA
-- ============================================

-- Show sample data from discounts table
SELECT
    'Sample discounts data:' as info;
SELECT
    *
FROM discounts
LIMIT 5;

-- ============================================
-- 3. CHECK COLUMN NAMES
-- ============================================

-- Show just the column names
SELECT
    'Column names in discounts table:' as info;
SELECT
    column_name
FROM information_schema.columns
WHERE table_name = 'discounts'
ORDER BY ordinal_position; 