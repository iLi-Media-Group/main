-- Check for Promotion Codes
-- This script checks if promotion codes exist in other tables or if we need to add them

-- ============================================
-- 1. CHECK ALL TABLES FOR PROMOTION CODES
-- ============================================

-- Show all tables that might contain promotion codes
SELECT
    'Tables with promotion code columns:' as info;
SELECT DISTINCT
    t.table_name,
    c.column_name
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND (c.column_name ILIKE '%promotion%' OR c.column_name ILIKE '%code%' OR c.column_name ILIKE '%coupon%')
ORDER BY t.table_name, c.column_name;

-- ============================================
-- 2. CHECK STRIPE COUPONS TABLE
-- ============================================

-- Check if there's a stripe_coupons table
SELECT
    'Stripe coupons table exists:' as info;
SELECT
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_coupons') 
        THEN 'YES' 
        ELSE 'NO' 
    END as exists;

-- If it exists, show its structure
SELECT
    'Stripe coupons table structure:' as info;
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'stripe_coupons'
ORDER BY ordinal_position;

-- ============================================
-- 3. CHECK CURRENT DISCOUNTS DATA
-- ============================================

-- Show current discounts data
SELECT
    'Current discounts data:' as info;
SELECT
    id,
    name,
    description,
    discount_percent,
    applies_to,
    start_date,
    end_date,
    is_active,
    created_at
FROM discounts
ORDER BY created_at DESC;

-- ============================================
-- 4. CHECK IF WE NEED TO ADD PROMOTION CODE COLUMN
-- ============================================

-- Check if promotion_code column exists in discounts
SELECT
    'Promotion code column in discounts:' as info;
SELECT
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discounts' AND column_name = 'promotion_code') 
        THEN 'EXISTS' 
        ELSE 'MISSING - NEEDS TO BE ADDED' 
    END as status; 