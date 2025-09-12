-- Create a test discount for single_track
-- This will help us verify if the discount system is working

INSERT INTO discounts (
    name,
    description,
    discount_percent,
    applies_to,
    start_date,
    end_date,
    is_active
) VALUES (
    'Test Single Track Discount',
    'Test discount for debugging single track purchases',
    15.00,
    ARRAY['single_track'],
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    true
);

-- Verify the discount was created
SELECT 'Test discount created:' as info;
SELECT 
    id,
    name,
    discount_percent,
    applies_to,
    start_date,
    end_date,
    is_active,
    created_at
FROM discounts
WHERE name = 'Test Single Track Discount';

-- Test the discount function
SELECT 'Testing discount function for single_track:' as info;
SELECT * FROM calculate_discounted_price(1000, 'single_track', CURRENT_DATE); 