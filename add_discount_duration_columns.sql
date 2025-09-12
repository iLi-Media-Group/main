-- Add columns for discount duration and usage configuration

-- Add new columns to discounts table
ALTER TABLE discounts 
ADD COLUMN IF NOT EXISTS duration_type VARCHAR(20) DEFAULT 'once' CHECK (duration_type IN ('once', 'repeating', 'forever')),
ADD COLUMN IF NOT EXISTS duration_in_months INTEGER,
ADD COLUMN IF NOT EXISTS max_redemptions INTEGER,
ADD COLUMN IF NOT EXISTS max_redemptions_per_customer INTEGER,
ADD COLUMN IF NOT EXISTS usage_restrictions JSONB;

-- Update existing discounts to have proper defaults
UPDATE discounts 
SET 
    duration_type = 'once',
    max_redemptions = NULL, -- Unlimited
    max_redemptions_per_customer = NULL -- Unlimited per customer
WHERE duration_type IS NULL;

-- Verify the new columns exist
SELECT 'New columns added:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'discounts' 
  AND column_name IN ('duration_type', 'duration_in_months', 'max_redemptions', 'max_redemptions_per_customer', 'usage_restrictions');

-- Check current state of all discounts
SELECT 'Current discount configurations:' as info;
SELECT 
    id,
    name,
    promotion_code,
    discount_percent,
    duration_type,
    duration_in_months,
    max_redemptions,
    max_redemptions_per_customer
FROM discounts
WHERE discount_type = 'promotion_code'
ORDER BY created_at DESC; 