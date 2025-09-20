-- First, ensure our database has the WELCOME30 discount
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
    'Welcome Discount',
    'Use this code for a discount on your purchase!',
    30.00,
    ARRAY['single_track', 'gold_access', 'platinum_access', 'ultimate_access'],
    'promotion_code',
    'WELCOME30',
    false,
    true,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    NOW(),
    NOW()
) ON CONFLICT (promotion_code) DO UPDATE SET
    discount_percent = EXCLUDED.discount_percent,
    description = EXCLUDED.description,
    applies_to = EXCLUDED.applies_to,
    discount_type = EXCLUDED.discount_type,
    is_automatic = EXCLUDED.is_automatic,
    is_active = EXCLUDED.is_active,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    updated_at = NOW();

-- Verify the discount was created
SELECT 'WELCOME30 discount created in database:' as info;
SELECT 
    name,
    discount_percent,
    applies_to,
    discount_type,
    promotion_code,
    is_automatic,
    start_date,
    end_date,
    is_active,
    CASE 
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'ACTIVE TODAY'
        ELSE 'NOT ACTIVE TODAY'
    END as date_status
FROM discounts
WHERE promotion_code = 'WELCOME30';

-- Test the promotion code validation
SELECT 'Testing WELCOME30 validation:' as info;
SELECT * FROM validate_promotion_code('WELCOME30', 'single_track', CURRENT_DATE);

-- Test the discount calculation with WELCOME30
SELECT 'Testing WELCOME30 discount calculation:' as info;
SELECT * FROM calculate_discounted_price(999, 'single_track', CURRENT_DATE, 'WELCOME30');

-- IMPORTANT: You need to manually create this coupon in Stripe Dashboard
-- Go to https://dashboard.stripe.com/coupons
-- Create a new coupon with:
-- - ID: WELCOME30
-- - Name: Welcome Discount
-- - Percent off: 30%
-- - Duration: Once
-- - Redemption limit: Unlimited
-- - Valid from: Today
-- - Valid until: 30 days from today 