-- Drop the existing function to clear any cached versions
DROP FUNCTION IF EXISTS calculate_discounted_price(NUMERIC, TEXT, DATE, TEXT);
DROP FUNCTION IF EXISTS calculate_discounted_price(NUMERIC, TEXT, DATE);
DROP FUNCTION IF EXISTS calculate_discounted_price(NUMERIC, TEXT);

-- Recreate the function with the correct signature
CREATE OR REPLACE FUNCTION calculate_discounted_price(
    p_original_price NUMERIC,
    item_name TEXT,
    check_date DATE DEFAULT CURRENT_DATE,
    promotion_code_input TEXT DEFAULT NULL
)
RETURNS TABLE (
    original_price NUMERIC,
    discount_percent DECIMAL(5,2),
    discounted_price NUMERIC,
    discount_name VARCHAR(255),
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
            NULL::VARCHAR(255),
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

-- Test the function
SELECT 'Testing recreated calculate_discounted_price function:' as info;
SELECT * FROM calculate_discounted_price(999, 'single_track', CURRENT_DATE); 