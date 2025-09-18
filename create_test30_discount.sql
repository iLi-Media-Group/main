-- Create TEST30 discount in the database
-- Run this in Supabase Dashboard > SQL Editor

-- First, let's see what discounts exist
SELECT 'Existing discounts:' as info;
SELECT 
    id,
    name,
    promotion_code,
    discount_percent
FROM discounts
WHERE discount_type = 'promotion_code'
ORDER BY created_at DESC;

-- Create TEST30 discount
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
    created_at,
    updated_at
) VALUES (
    'TEST30 Discount',
    'Test discount for 30% off',
    30.00,
    ARRAY['single_track', 'gold_access', 'platinum_access', 'ultimate_access'],
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    true,
    'promotion_code',
    'TEST30',
    NOW(),
    NOW()
);

-- Verify the TEST30 discount was created
SELECT 'Created TEST30 discount:' as info;
SELECT 
    id,
    name,
    promotion_code,
    discount_percent,
    stripe_coupon_id,
    stripe_coupon_created_at,
    created_at
FROM discounts
WHERE promotion_code = 'TEST30';

-- Show all promotion code discounts
SELECT 'All promotion code discounts:' as info;
SELECT 
    id,
    name,
    promotion_code,
    discount_percent,
    stripe_coupon_id,
    stripe_coupon_created_at
FROM discounts
WHERE discount_type = 'promotion_code'
ORDER BY created_at DESC; 