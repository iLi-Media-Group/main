-- Create a promotion code discount for clients
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
    'Use this code for a discount on your first purchase!',
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
) ON CONFLICT (name) DO UPDATE SET
    discount_percent = EXCLUDED.discount_percent,
    description = EXCLUDED.description,
    applies_to = EXCLUDED.applies_to,
    discount_type = EXCLUDED.discount_type,
    promotion_code = EXCLUDED.promotion_code,
    is_automatic = EXCLUDED.is_automatic,
    is_active = EXCLUDED.is_active,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    updated_at = NOW();

-- Verify the discount was created
SELECT 'Promotion code discount created:' as info;
SELECT 
    name,
    discount_percent,
    applies_to,
    discount_type,
    promotion_code,
    is_automatic,
    start_date,
    end_date,
    is_active
FROM discounts
WHERE promotion_code = 'WELCOME30'; 