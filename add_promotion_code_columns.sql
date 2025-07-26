-- Add columns for tracking Stripe promotion codes

-- Add new columns to discounts table
ALTER TABLE discounts 
ADD COLUMN IF NOT EXISTS stripe_promotion_code_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_promotion_code_created_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_discounts_stripe_promotion_code_id 
ON discounts(stripe_promotion_code_id);

-- Verify the new columns exist
SELECT 'New columns added:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'discounts' 
  AND column_name IN ('stripe_promotion_code_id', 'stripe_promotion_code_created_at');

-- Check current state of TEST30 discount
SELECT 'Current TEST30 state:' as info;
SELECT 
    id,
    name,
    promotion_code,
    stripe_coupon_id,
    stripe_promotion_code_id,
    stripe_coupon_created_at,
    stripe_promotion_code_created_at
FROM discounts
WHERE promotion_code = 'TEST30'; 