-- Add Stripe Columns to Discounts Table
-- This script adds the missing Stripe-related columns to the discounts table

-- ============================================
-- 1. CHECK CURRENT DISCOUNTS TABLE STRUCTURE
-- ============================================

SELECT
    'Current discounts table columns:' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'discounts'
ORDER BY ordinal_position;

-- ============================================
-- 2. ADD MISSING STRIPE COLUMNS
-- ============================================

-- Add stripe_coupon_id column
ALTER TABLE discounts 
ADD COLUMN IF NOT EXISTS stripe_coupon_id TEXT;

-- Add stripe_coupon_created_at column
ALTER TABLE discounts 
ADD COLUMN IF NOT EXISTS stripe_coupon_created_at TIMESTAMP WITH TIME ZONE;

-- Add stripe_promotion_code_id column (for the promotion code ID)
ALTER TABLE discounts 
ADD COLUMN IF NOT EXISTS stripe_promotion_code_id TEXT;

-- Add stripe_promotion_code_created_at column
ALTER TABLE discounts 
ADD COLUMN IF NOT EXISTS stripe_promotion_code_created_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 3. VERIFY THE NEW COLUMNS
-- ============================================

SELECT
    'Updated discounts table columns:' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'discounts'
ORDER BY ordinal_position;

-- ============================================
-- 4. CHECK DISCOUNTS WITH STRIPE DATA
-- ============================================

SELECT
    'All discounts with new Stripe columns:' as info;
SELECT
    id,
    name,
    promotion_code,
    stripe_coupon_id,
    stripe_coupon_created_at,
    stripe_promotion_code_id,
    stripe_promotion_code_created_at,
    created_at
FROM discounts
ORDER BY created_at DESC;

-- ============================================
-- 5. SUMMARY
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
    'Discounts with Stripe coupon IDs' as category,
    COUNT(*) as count
FROM discounts
WHERE stripe_coupon_id IS NOT NULL

UNION ALL

SELECT
    'Discounts with Stripe promotion code IDs' as category,
    COUNT(*) as count
FROM discounts
WHERE stripe_promotion_code_id IS NOT NULL; 