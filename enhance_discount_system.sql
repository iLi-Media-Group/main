-- Enhance discount system to support both automatic discounts and promotion codes

-- Add new columns to the discounts table
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'automatic' CHECK (discount_type IN ('automatic', 'promotion_code'));
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS promotion_code TEXT;
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS is_automatic BOOLEAN DEFAULT true;

-- Update existing discounts to be automatic
UPDATE discounts SET 
    discount_type = 'automatic',
    is_automatic = true
WHERE discount_type IS NULL;

-- Create index for promotion codes
CREATE INDEX IF NOT EXISTS idx_discounts_promotion_code ON discounts(promotion_code);

-- Enhanced function to get applicable discounts (supports both automatic and promotion codes)
CREATE OR REPLACE FUNCTION get_applicable_discounts(
    item_name TEXT,
    check_date DATE DEFAULT CURRENT_DATE,
    promotion_code_input TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    discount_percent DECIMAL(5,2),
    applies_to TEXT[],
    discount_type TEXT,
    promotion_code TEXT,
    is_automatic BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.name,
        d.description,
        d.discount_percent,
        d.applies_to,
        d.discount_type,
        d.promotion_code,
        d.is_automatic
    FROM discounts d
    WHERE d.is_active = true
    AND check_date BETWEEN d.start_date AND d.end_date
    AND (
        -- Automatic discounts apply to all or specific items
        (d.discount_type = 'automatic' AND (
            'all' = ANY(d.applies_to) 
            OR item_name = ANY(d.applies_to)
        ))
        -- Promotion code discounts require exact code match
        OR (d.discount_type = 'promotion_code' 
            AND promotion_code_input IS NOT NULL 
            AND d.promotion_code = promotion_code_input)
    )
    ORDER BY d.discount_percent DESC, d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced function to calculate discounted price
CREATE OR REPLACE FUNCTION calculate_discounted_price(
    p_original_price DECIMAL(10,2),
    item_name TEXT,
    check_date DATE DEFAULT CURRENT_DATE,
    promotion_code_input TEXT DEFAULT NULL
)
RETURNS TABLE (
    original_price DECIMAL(10,2),
    discount_percent DECIMAL(5,2),
    discounted_price DECIMAL(10,2),
    discount_name TEXT,
    discount_description TEXT,
    discount_type TEXT,
    promotion_code TEXT
) AS $$
DECLARE
    best_discount RECORD;
BEGIN
    -- Get the best discount (highest percentage) for this item
    SELECT * INTO best_discount
    FROM get_applicable_discounts(item_name, check_date, promotion_code_input)
    LIMIT 1;
    
    IF best_discount.id IS NULL THEN
        -- No discount available
        RETURN QUERY SELECT
            p_original_price,
            0::DECIMAL(5,2),
            p_original_price,
            NULL::TEXT,
            NULL::TEXT,
            NULL::TEXT,
            NULL::TEXT;
    ELSE
        -- Apply discount
        RETURN QUERY SELECT
            p_original_price,
            best_discount.discount_percent,
            p_original_price * (1 - best_discount.discount_percent / 100),
            best_discount.name,
            best_discount.description,
            best_discount.discount_type,
            best_discount.promotion_code;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate promotion codes
CREATE OR REPLACE FUNCTION validate_promotion_code(
    code_input TEXT,
    item_name TEXT,
    check_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    is_valid BOOLEAN,
    discount_percent DECIMAL(5,2),
    discount_name TEXT,
    discount_description TEXT
) AS $$
DECLARE
    discount_record RECORD;
BEGIN
    -- Check if the promotion code exists and is valid
    SELECT * INTO discount_record
    FROM discounts
    WHERE promotion_code = code_input
    AND discount_type = 'promotion_code'
    AND is_active = true
    AND check_date BETWEEN start_date AND end_date
    AND (
        'all' = ANY(applies_to) 
        OR item_name = ANY(applies_to)
    );
    
    IF discount_record.id IS NULL THEN
        -- Invalid or expired promotion code
        RETURN QUERY SELECT
            false,
            0::DECIMAL(5,2),
            NULL::TEXT,
            NULL::TEXT;
    ELSE
        -- Valid promotion code
        RETURN QUERY SELECT
            true,
            discount_record.discount_percent,
            discount_record.name,
            discount_record.description;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the Grand Opening Sale to be automatic
UPDATE discounts 
SET 
    discount_type = 'automatic',
    is_automatic = true
WHERE name = 'Grand Opening Sale';

-- Create a sample promotion code discount
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
    is_automatic
) VALUES (
    'WELCOME10',
    'Welcome discount for new customers',
    10.00,
    ARRAY['single_track'],
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '90 days',
    true,
    'promotion_code',
    'WELCOME10',
    false
) ON CONFLICT DO NOTHING; 