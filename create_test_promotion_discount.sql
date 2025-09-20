-- Create a test promotion code discount to verify automation

-- First, let's create a test promotion code discount
INSERT INTO discounts (
    name, 
    description, 
    discount_percent, 
    applies_to, 
    discount_type, 
    promotion_code, 
    is_automatic, 
    is_active, 
    start_date, 
    end_date,
    created_at,
    updated_at
) VALUES (
    'Test Auto Discount',
    'Test discount for automation verification',
    25.00,
    ARRAY['single_track'],
    'promotion_code',
    'AUTO25',
    false,
    true,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    NOW(),
    NOW()
) ON CONFLICT (name) DO NOTHING;

-- Check if the test discount was created
SELECT 'Test discount created:' as info;
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
WHERE promotion_code = 'AUTO25';

-- Show all promotion code discounts after creating test
SELECT 'All promotion code discounts after test:' as info;
SELECT 
    id,
    name,
    discount_type,
    promotion_code,
    discount_percent,
    stripe_coupon_id,
    stripe_coupon_created_at,
    CASE 
        WHEN stripe_coupon_id IS NULL THEN 'SHOULD SHOW BUTTON'
        ELSE 'SHOULD NOT SHOW BUTTON (already created)'
    END as button_should_show
FROM discounts
WHERE discount_type = 'promotion_code'
ORDER BY created_at DESC; 