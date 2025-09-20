-- Add Promotion Code Column to Discounts Table
-- This script adds the missing promotion_code and discount_type columns

-- ============================================
-- 1. ADD PROMOTION CODE COLUMN
-- ============================================

-- Add promotion_code column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'discounts' AND column_name = 'promotion_code'
    ) THEN
        ALTER TABLE discounts ADD COLUMN promotion_code TEXT;
    END IF;
END $$;

-- ============================================
-- 2. ADD DISCOUNT TYPE COLUMN
-- ============================================

-- Add discount_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'discounts' AND column_name = 'discount_type'
    ) THEN
        ALTER TABLE discounts ADD COLUMN discount_type TEXT DEFAULT 'automatic';
    END IF;
END $$;

-- ============================================
-- 3. UPDATE EXISTING DISCOUNTS
-- ============================================

-- Update existing discounts to have a discount_type
UPDATE discounts 
SET discount_type = 'automatic' 
WHERE discount_type IS NULL;

-- ============================================
-- 4. VERIFY CHANGES
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
-- 5. INSERT SAMPLE PROMOTION CODE
-- ============================================

-- Insert a sample promotion code discount
INSERT INTO discounts (
    name,
    description,
    promotion_code,
    discount_percent,
    discount_type,
    applies_to,
    start_date,
    end_date,
    is_active
) VALUES (
    'Welcome Discount',
    'Get 20% off your first purchase',
    'WELCOME20',
    20,
    'promotion_code',
    ARRAY['all'],
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    true
) ON CONFLICT DO NOTHING;

-- ============================================
-- 6. SHOW FINAL DATA
-- ============================================

-- Show all discounts including the new promotion code
SELECT
    'All discounts including promotion codes:' as info;
SELECT
    id,
    name,
    description,
    promotion_code,
    discount_percent,
    discount_type,
    applies_to,
    start_date,
    end_date,
    is_active,
    created_at
FROM discounts
ORDER BY created_at DESC; 