-- Add Stripe-related columns to discounts table
-- This script adds the missing columns needed for Stripe integration

-- ============================================
-- 1. ADD STRIPE COUPON COLUMNS
-- ============================================

-- Add stripe_coupon_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'discounts' AND column_name = 'stripe_coupon_id'
    ) THEN
        ALTER TABLE discounts ADD COLUMN stripe_coupon_id TEXT;
    END IF;
END $$;

-- Add stripe_coupon_created_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'discounts' AND column_name = 'stripe_coupon_created_at'
    ) THEN
        ALTER TABLE discounts ADD COLUMN stripe_coupon_created_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ============================================
-- 2. ADD STRIPE PROMOTION CODE COLUMNS
-- ============================================

-- Add stripe_promotion_code_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'discounts' AND column_name = 'stripe_promotion_code_id'
    ) THEN
        ALTER TABLE discounts ADD COLUMN stripe_promotion_code_id TEXT;
    END IF;
END $$;

-- Add stripe_promotion_code_created_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'discounts' AND column_name = 'stripe_promotion_code_created_at'
    ) THEN
        ALTER TABLE discounts ADD COLUMN stripe_promotion_code_created_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ============================================
-- 3. VERIFY COLUMNS ADDED
-- ============================================

-- Show updated table structure
SELECT
    'Updated discounts table structure:' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'discounts'
ORDER BY ordinal_position;

-- ============================================
-- 4. SHOW CURRENT STRIPE INTEGRATION STATUS
-- ============================================

-- Show current Stripe integration status for all discounts
SELECT
    'Current Stripe integration status:' as info;
SELECT
    id,
    name,
    promotion_code,
    discount_percent,
    stripe_coupon_id,
    stripe_promotion_code_id,
    CASE 
        WHEN stripe_coupon_id IS NOT NULL AND stripe_promotion_code_id IS NOT NULL 
        THEN '✅ FULLY INTEGRATED'
        WHEN stripe_coupon_id IS NOT NULL 
        THEN '⚠️ HAS COUPON, NEEDS PROMOTION CODE'
        WHEN discount_type = 'promotion_code' AND promotion_code IS NOT NULL
        THEN '❌ NEEDS STRIPE INTEGRATION'
        ELSE 'ℹ️ AUTOMATIC DISCOUNT (NO STRIPE NEEDED)'
    END as integration_status
FROM discounts
ORDER BY created_at DESC; 