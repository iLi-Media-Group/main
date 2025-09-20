-- Add columns for discount duration and usage configuration
-- Run this in Supabase Dashboard > SQL Editor

-- Add new columns to discounts table
ALTER TABLE discounts 
ADD COLUMN IF NOT EXISTS duration_type VARCHAR(20) DEFAULT 'once',
ADD COLUMN IF NOT EXISTS duration_in_months INTEGER,
ADD COLUMN IF NOT EXISTS max_redemptions INTEGER,
ADD COLUMN IF NOT EXISTS max_redemptions_per_customer INTEGER,
ADD COLUMN IF NOT EXISTS usage_restrictions JSONB,
ADD COLUMN IF NOT EXISTS stripe_promotion_code_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_promotion_code_created_at TIMESTAMP WITH TIME ZONE;

-- Add check constraint for duration_type
ALTER TABLE discounts 
DROP CONSTRAINT IF EXISTS discounts_duration_type_check;

ALTER TABLE discounts 
ADD CONSTRAINT discounts_duration_type_check 
CHECK (duration_type IN ('once', 'repeating', 'forever'));

-- Update existing discounts to have proper defaults
UPDATE discounts 
SET 
    duration_type = 'once',
    max_redemptions = NULL, -- Unlimited
    max_redemptions_per_customer = NULL -- Unlimited per customer
WHERE duration_type IS NULL;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_discounts_stripe_promotion_code_id 
ON discounts(stripe_promotion_code_id);

CREATE INDEX IF NOT EXISTS idx_discounts_duration_type 
ON discounts(duration_type);

-- Verify the new columns exist
SELECT 'New columns added:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'discounts' 
  AND column_name IN ('duration_type', 'duration_in_months', 'max_redemptions', 'max_redemptions_per_customer', 'usage_restrictions', 'stripe_promotion_code_id', 'stripe_promotion_code_created_at');

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
    max_redemptions_per_customer,
    stripe_coupon_id,
    stripe_promotion_code_id
FROM discounts
WHERE discount_type = 'promotion_code'
ORDER BY created_at DESC; 