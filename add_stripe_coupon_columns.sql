-- Add missing Stripe coupon columns to discounts table

-- Add the missing columns
ALTER TABLE discounts 
ADD COLUMN IF NOT EXISTS stripe_coupon_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_coupon_created_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_discounts_stripe_coupon_id ON discounts(stripe_coupon_id);

-- Verify the columns were added
SELECT 'Verifying columns were added:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'discounts' 
AND column_name IN ('stripe_coupon_id', 'stripe_coupon_created_at')
ORDER BY column_name;

-- Show current discounts and their Stripe coupon status
SELECT 'Current discounts and their Stripe coupon status:' as info;
SELECT 
    id,
    name,
    discount_type,
    promotion_code,
    discount_percent,
    stripe_coupon_id,
    stripe_coupon_created_at,
    is_active,
    start_date,
    end_date,
    CASE 
        WHEN discount_type = 'promotion_code' AND stripe_coupon_id IS NULL THEN '⚠️ Needs Stripe Coupon Button'
        WHEN discount_type = 'promotion_code' AND stripe_coupon_id IS NOT NULL THEN '✅ Stripe Coupon Created'
        WHEN discount_type = 'automatic' THEN 'ℹ️ Automatic (No Button)'
        ELSE '❓ Unknown'
    END as button_status
FROM discounts
ORDER BY created_at DESC; 