BEGIN;

-- Drop the table if it exists to ensure a clean slate
DROP TABLE IF EXISTS discounts CASCADE;

-- Create discounts table for managing service and plan discounts
CREATE TABLE IF NOT EXISTS discounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_percent DECIMAL(5,2) NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
    applies_to TEXT[] NOT NULL, -- Array of applicable items: 'starter', 'pro', 'enterprise', 'producer_applications', 'ai_recommendations', 'deep_media_search', 'all'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(is_active);
CREATE INDEX IF NOT EXISTS idx_discounts_date_range ON discounts(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_discounts_applies_to ON discounts USING GIN(applies_to);

-- Add RLS policies for discounts
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Only admins can manage discounts
CREATE POLICY "Allow admin access to discounts" ON discounts
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM profiles WHERE account_type = 'admin'
    ));

-- All authenticated users can read active discounts
CREATE POLICY "Allow read access to active discounts" ON discounts
    FOR SELECT USING (
        is_active = true 
        AND CURRENT_DATE BETWEEN start_date AND end_date
    );

-- Function to get applicable discounts for a given item and date
CREATE OR REPLACE FUNCTION get_applicable_discounts(
    item_name TEXT,
    check_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    discount_percent DECIMAL(5,2),
    applies_to TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.name,
        d.description,
        d.discount_percent,
        d.applies_to
    FROM discounts d
    WHERE d.is_active = true
    AND check_date BETWEEN d.start_date AND d.end_date
    AND (
        'all' = ANY(d.applies_to) 
        OR item_name = ANY(d.applies_to)
    )
    ORDER BY d.discount_percent DESC, d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate discounted price
CREATE OR REPLACE FUNCTION calculate_discounted_price(
    p_original_price DECIMAL(10,2),
    item_name TEXT,
    check_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    original_price DECIMAL(10,2),
    discount_percent DECIMAL(5,2),
    discounted_price DECIMAL(10,2),
    discount_name TEXT,
    discount_description TEXT
) AS $$
DECLARE
    best_discount RECORD;
BEGIN
    -- Get the best discount (highest percentage) for this item
    SELECT * INTO best_discount
    FROM get_applicable_discounts(item_name, check_date)
    LIMIT 1;
    
    IF best_discount.id IS NULL THEN
        -- No discount available
        RETURN QUERY SELECT
            p_original_price,
            0::DECIMAL(5,2),
            p_original_price,
            NULL::TEXT,
            NULL::TEXT;
    ELSE
        -- Apply discount
        RETURN QUERY SELECT
            p_original_price,
            best_discount.discount_percent,
            p_original_price * (1 - best_discount.discount_percent / 100),
            best_discount.name,
            best_discount.description;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample discounts for testing
INSERT INTO discounts (name, description, discount_percent, applies_to, start_date, end_date, is_active) VALUES
('Spring Launch Sale', 'Get 20% off all White Label plans for new customers', 20.00, ARRAY['all'], '2024-03-01', '2024-06-30', true),
('Feature Bundle Discount', 'Save 15% when adding multiple features', 15.00, ARRAY['producer_applications', 'ai_recommendations', 'deep_media_search'], '2024-01-01', '2024-12-31', true),
('Pro Plan Special', 'Limited time 25% off Pro plan setup', 25.00, ARRAY['pro'], '2024-04-01', '2024-05-31', true),
('Starter Plan Discount', '10% off Starter plan for small businesses', 10.00, ARRAY['starter'], '2024-01-01', '2024-12-31', true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_discounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discounts_updated_at
    BEFORE UPDATE ON discounts
    FOR EACH ROW
    EXECUTE FUNCTION update_discounts_updated_at();

COMMIT;