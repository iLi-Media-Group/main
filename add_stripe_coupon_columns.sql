-- Add columns to track Stripe coupon information
ALTER TABLE discounts 
ADD COLUMN IF NOT EXISTS stripe_coupon_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_coupon_created_at TIMESTAMP WITH TIME ZONE;

-- Create index for Stripe coupon ID
CREATE INDEX IF NOT EXISTS idx_discounts_stripe_coupon_id ON discounts(stripe_coupon_id);

-- Update existing WELCOME30 discount to show it needs Stripe coupon creation
UPDATE discounts 
SET stripe_coupon_id = NULL,
    stripe_coupon_created_at = NULL
WHERE promotion_code = 'WELCOME30';

-- Show current status
SELECT 'Current discounts with Stripe coupon status:' as info;
SELECT 
    name,
    promotion_code,
    discount_type,
    stripe_coupon_id,
    stripe_coupon_created_at,
    CASE 
        WHEN stripe_coupon_id IS NOT NULL THEN '✅ Stripe Coupon Created'
        WHEN discount_type = 'promotion_code' AND promotion_code IS NOT NULL THEN '⚠️ Needs Stripe Coupon'
        ELSE 'ℹ️ Not Applicable'
    END as stripe_status
FROM discounts
WHERE discount_type = 'promotion_code'; 