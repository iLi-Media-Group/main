-- Link TEST30 discount to the existing Stripe coupon
-- Run this in Supabase Dashboard > SQL Editor

-- First, let's see the current state
SELECT 'Current TEST30 discount:' as info;
SELECT 
    id,
    name,
    promotion_code,
    stripe_coupon_id,
    stripe_coupon_created_at
FROM discounts
WHERE promotion_code = 'TEST30';

-- Update TEST30 with the Stripe coupon ID
UPDATE discounts
SET 
    stripe_coupon_id = 'KK4HtRit',
    stripe_coupon_created_at = NOW(),
    updated_at = NOW()
WHERE promotion_code = 'TEST30'
  AND discount_type = 'promotion_code';

-- Verify the update
SELECT 'Updated TEST30 discount:' as info;
SELECT 
    id,
    name,
    promotion_code,
    stripe_coupon_id,
    stripe_coupon_created_at
FROM discounts
WHERE promotion_code = 'TEST30';

-- Check all promotion code discounts
SELECT 'All promotion code discounts:' as info;
SELECT 
    id,
    name,
    promotion_code,
    stripe_coupon_id,
    stripe_coupon_created_at
FROM discounts
WHERE discount_type = 'promotion_code'
ORDER BY created_at DESC; 