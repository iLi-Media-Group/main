-- Fix Discounts Table Schema
-- This script fixes the discounts table to match what was working on Saturday

-- ============================================
-- 1. CHECK CURRENT TABLE STRUCTURE
-- ============================================

SELECT
    'Current discounts table structure:' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'discounts'
ORDER BY ordinal_position;

-- ============================================
-- 2. FIX MISSING COLUMNS AND CONSTRAINTS
-- ============================================

-- Add missing columns that should exist
ALTER TABLE discounts 
ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'automatic',
ADD COLUMN IF NOT EXISTS promotion_code TEXT,
ADD COLUMN IF NOT EXISTS stripe_coupon_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_coupon_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_promotion_code_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_promotion_code_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS duration_type VARCHAR(20) DEFAULT 'once',
ADD COLUMN IF NOT EXISTS duration_in_months INTEGER,
ADD COLUMN IF NOT EXISTS max_redemptions INTEGER,
ADD COLUMN IF NOT EXISTS max_redemptions_per_customer INTEGER,
ADD COLUMN IF NOT EXISTS usage_restrictions JSONB;

-- Add check constraint for discount_type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'discounts_discount_type_check'
    ) THEN
        ALTER TABLE discounts ADD CONSTRAINT discounts_discount_type_check 
        CHECK (discount_type IN ('automatic', 'promotion_code'));
    END IF;
END $$;

-- Add check constraint for duration_type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'discounts_duration_type_check'
    ) THEN
        ALTER TABLE discounts ADD CONSTRAINT discounts_duration_type_check 
        CHECK (duration_type IN ('once', 'repeating', 'forever'));
    END IF;
END $$;

-- ============================================
-- 3. UPDATE EXISTING DATA
-- ============================================

-- Update existing discounts to have proper defaults
UPDATE discounts 
SET 
    discount_type = COALESCE(discount_type, 'automatic'),
    duration_type = COALESCE(duration_type, 'once')
WHERE discount_type IS NULL OR duration_type IS NULL;

-- ============================================
-- 4. CREATE INDEXES IF THEY DON'T EXIST
-- ============================================

CREATE INDEX IF NOT EXISTS idx_discounts_promotion_code ON discounts(promotion_code);
CREATE INDEX IF NOT EXISTS idx_discounts_stripe_coupon_id ON discounts(stripe_coupon_id);
CREATE INDEX IF NOT EXISTS idx_discounts_stripe_promotion_code_id ON discounts(stripe_promotion_code_id);
CREATE INDEX IF NOT EXISTS idx_discounts_duration_type ON discounts(duration_type);

-- ============================================
-- 5. VERIFY THE FIXED STRUCTURE
-- ============================================

SELECT
    'Fixed discounts table structure:' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'discounts'
ORDER BY ordinal_position;

-- ============================================
-- 6. TEST INSERT
-- ============================================

-- Test inserting a discount to make sure it works
INSERT INTO discounts (
    name,
    description,
    discount_percent,
    applies_to,
    start_date,
    end_date,
    is_active,
    discount_type,
    promotion_code,
    duration_type
) VALUES (
    'Test Discount',
    'Test discount to verify schema',
    10.00,
    ARRAY['all'],
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    true,
    'promotion_code',
    'TEST10',
    'once'
) ON CONFLICT DO NOTHING;

-- ============================================
-- 7. SHOW ALL DISCOUNTS
-- ============================================

SELECT
    'All discounts after fix:' as info;
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
    created_at
FROM discounts
ORDER BY created_at DESC;

-- ============================================
-- 8. CLEANUP TEST DATA
-- ============================================

-- Remove the test discount
DELETE FROM discounts WHERE name = 'Test Discount';

-- ============================================
-- 9. SUMMARY
-- ============================================

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
    'Discounts with promotion codes' as category,
    COUNT(*) as count
FROM discounts
WHERE promotion_code IS NOT NULL AND promotion_code != ''

UNION ALL

SELECT
    'Discounts with Stripe coupons' as category,
    COUNT(*) as count
FROM discounts
WHERE stripe_coupon_id IS NOT NULL; 