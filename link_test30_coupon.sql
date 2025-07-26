-- Link the Stripe coupon ID to the TEST30 discount

-- First, let's see the current state
SELECT 'Current TEST30 discount state:' as info;
SELECT 
    id,
    name,
    promotion_code,
    stripe_coupon_id,
    stripe_coupon_created_at
FROM discounts
WHERE promotion_code = 'TEST30';

-- Update the TEST30 discount with the Stripe coupon ID
UPDATE discounts
SET 
    stripe_coupon_id = 'KK4HtRit',
    stripe_coupon_created_at = NOW(),
    updated_at = NOW()
WHERE promotion_code = 'TEST30'
  AND discount_type = 'promotion_code';

-- Verify the update
SELECT 'Updated TEST30 discount state:' as info;
SELECT 
    id,
    name,
    promotion_code,
    stripe_coupon_id,
    stripe_coupon_created_at
FROM discounts
WHERE promotion_code = 'TEST30';

-- Test the linkage by simulating what the checkout function would do
SELECT 'Testing promotion code lookup:' as info;
SELECT 
    id,
    name,
    promotion_code,
    stripe_coupon_id
FROM discounts
WHERE promotion_code = 'TEST30'
  AND discount_type = 'promotion_code'
  AND stripe_coupon_id IS NOT NULL; 