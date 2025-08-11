-- Adaptive Churn Risk System for Licensing Platform
-- This system calculates personalized churn risk scores that adapt to each client's buying patterns

-- Create a function to calculate days since last activity
CREATE OR REPLACE FUNCTION get_days_since_last_activity(input_client_id UUID)
RETURNS INTEGER AS $$
DECLARE
    last_activity_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get the most recent purchase activity
    SELECT COALESCE(last_purchase_date, '1970-01-01'::timestamp) INTO last_activity_date
    FROM (
        SELECT 
            client_id,
            MAX(created_at) as last_purchase_date
        FROM (
            SELECT client_id, created_at FROM sync_proposals WHERE client_id = input_client_id AND payment_status = 'paid'
            UNION ALL
            SELECT client_id, created_at FROM custom_sync_requests WHERE client_id = input_client_id AND payment_status = 'paid'
        ) all_purchases
        GROUP BY client_id
    ) ap
    WHERE ap.client_id = input_client_id;
    
    RETURN EXTRACT(EPOCH FROM (NOW() - last_activity_date)) / 86400;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get purchase history for the last 12 months
CREATE OR REPLACE FUNCTION get_purchase_history_12mo(input_client_id UUID)
RETURNS TABLE(
    purchase_count INTEGER,
    total_spent NUMERIC,
    avg_purchase_interval NUMERIC,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    days_since_last_purchase INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH all_purchases AS (
        -- Sync proposals
        SELECT 
            created_at as purchase_date,
            COALESCE(final_amount, negotiated_amount, sync_fee) as purchase_amount
        FROM sync_proposals 
        WHERE client_id = input_client_id 
        AND payment_status = 'paid'
        AND created_at >= NOW() - INTERVAL '12 months'
        
        UNION ALL
        
        -- Custom sync requests
        SELECT 
            created_at as purchase_date,
            COALESCE(final_amount, negotiated_amount, sync_fee) as purchase_amount
        FROM custom_sync_requests 
        WHERE client_id = input_client_id 
        AND payment_status = 'paid'
        AND created_at >= NOW() - INTERVAL '12 months'
    ),
    purchase_stats AS (
        SELECT 
            COUNT(*) as purchase_count,
            COALESCE(SUM(purchase_amount), 0) as total_spent,
            MAX(purchase_date) as last_purchase_date,
            CASE 
                WHEN COUNT(*) > 1 THEN 
                    EXTRACT(EPOCH FROM (MAX(purchase_date) - MIN(purchase_date))) / (86400 * (COUNT(*) - 1))
                ELSE 365.0 -- Default to 1 year if only one purchase
            END as avg_purchase_interval
        FROM all_purchases
    )
    SELECT 
        ps.purchase_count,
        ps.total_spent,
        ps.avg_purchase_interval,
        ps.last_purchase_date,
        CASE 
            WHEN ps.last_purchase_date IS NOT NULL THEN
                EXTRACT(EPOCH FROM (NOW() - ps.last_purchase_date)) / 86400
            ELSE 365
        END as days_since_last_purchase
    FROM purchase_stats ps;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to calculate client lifetime value
CREATE OR REPLACE FUNCTION get_client_lifetime_value(input_client_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_value NUMERIC;
BEGIN
    SELECT COALESCE(SUM(total_amount), 0) INTO total_value
    FROM (
        -- Sync proposals
        SELECT COALESCE(final_amount, negotiated_amount, sync_fee) as total_amount
        FROM sync_proposals 
        WHERE client_id = input_client_id 
        AND payment_status = 'paid'
        
        UNION ALL
        
        -- Custom sync requests
        SELECT COALESCE(final_amount, negotiated_amount, sync_fee) as total_amount
        FROM custom_sync_requests 
        WHERE client_id = input_client_id 
        AND payment_status = 'paid'
    ) all_transactions;
    
    RETURN total_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to detect seasonality patterns
CREATE OR REPLACE FUNCTION is_seasonal_buyer(input_client_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    seasonal_pattern BOOLEAN := FALSE;
    purchase_months INTEGER[];
    holiday_count INTEGER := 0;
    summer_count INTEGER := 0;
    total_purchases INTEGER;
BEGIN
    -- Get purchase months for the last 2 years
    SELECT ARRAY_AGG(EXTRACT(MONTH FROM purchase_date)::INTEGER ORDER BY purchase_date)
    INTO purchase_months
    FROM (
        SELECT created_at as purchase_date FROM sync_proposals WHERE client_id = input_client_id AND payment_status = 'paid' AND created_at >= NOW() - INTERVAL '2 years'
        UNION ALL
        SELECT created_at as purchase_date FROM custom_sync_requests WHERE client_id = input_client_id AND payment_status = 'paid' AND created_at >= NOW() - INTERVAL '2 years'
    ) all_purchases;
    
    -- If we have enough data, check for seasonal patterns
    IF ARRAY_LENGTH(purchase_months, 1) >= 6 THEN
        total_purchases := ARRAY_LENGTH(purchase_months, 1);
        
        -- Count holiday season purchases (Nov/Dec)
        SELECT COUNT(*) INTO holiday_count 
        FROM UNNEST(purchase_months) AS month 
        WHERE month IN (11, 12);
        
        -- Count summer season purchases (Jun/Jul/Aug)
        SELECT COUNT(*) INTO summer_count 
        FROM UNNEST(purchase_months) AS month 
        WHERE month IN (6, 7, 8);
        
        -- If more than 50% of purchases are in seasonal months, consider them seasonal
        IF holiday_count > total_purchases * 0.5 OR summer_count > total_purchases * 0.5 THEN
            seasonal_pattern := TRUE;
        END IF;
    END IF;
    
    RETURN seasonal_pattern;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main adaptive churn risk calculation function
CREATE OR REPLACE FUNCTION calculate_adaptive_churn_risk(input_client_id UUID)
RETURNS TABLE(
    client_id UUID,
    risk_score INTEGER,
    risk_level TEXT,
    days_since_last_activity INTEGER,
    days_since_last_purchase INTEGER,
    purchase_count_12mo INTEGER,
    total_spent_12mo NUMERIC,
    avg_purchase_interval NUMERIC,
    lifetime_value NUMERIC,
    is_seasonal BOOLEAN,
    base_risk INTEGER,
    purchase_adjustment INTEGER,
    value_adjustment INTEGER,
    seasonality_adjustment NUMERIC,
    calculation_date TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    dsla INTEGER;
    dslp INTEGER;
    pl12 INTEGER;
    total_spent_12mo NUMERIC;
    adbp NUMERIC;
    clv NUMERIC;
    seasonal BOOLEAN;
    base_risk_val INTEGER;
    purchase_adj INTEGER := 0;
    value_adj INTEGER := 0;
    seasonality_multiplier NUMERIC := 1.0;
    final_risk INTEGER;
    risk_level_text TEXT;
BEGIN
    -- Get all the required data
    SELECT get_days_since_last_activity(input_client_id) INTO dsla;
    
    SELECT 
        ph.purchase_count,
        ph.total_spent,
        ph.avg_purchase_interval,
        ph.days_since_last_purchase
    INTO pl12, total_spent_12mo, adbp, dslp
    FROM get_purchase_history_12mo(input_client_id) ph;
    
    SELECT get_client_lifetime_value(input_client_id) INTO clv;
    SELECT is_seasonal_buyer(input_client_id) INTO seasonal;
    
    -- Calculate base risk based on inactivity relative to their normal buying pattern
    IF dsla <= adbp * 1.5 THEN
        base_risk_val := 10;
    ELSIF dsla <= adbp * 2 THEN
        base_risk_val := 25;
    ELSIF dsla <= adbp * 3 THEN
        base_risk_val := 45;
    ELSE
        base_risk_val := 70;
    END IF;
    
    -- Purchase history adjustment (high-value clients are stickier)
    IF pl12 >= 12 OR total_spent_12mo >= 2000 THEN
        purchase_adj := -30;
    ELSIF pl12 >= 6 OR total_spent_12mo >= 1000 THEN
        purchase_adj := -15;
    END IF;
    
    -- Long gap purchase adjustment
    IF dslp > adbp * 3 THEN
        base_risk_val := base_risk_val + 20;
    END IF;
    
    -- Value adjustment based on lifetime value
    IF clv > 5000 THEN
        value_adj := -20;
    ELSIF clv > 2500 THEN
        value_adj := -10;
    END IF;
    
    -- Seasonality adjustment
    IF seasonal THEN
        seasonality_multiplier := 0.7;
    END IF;
    
    -- Calculate final risk score
    final_risk := GREATEST(0, LEAST(100, 
        (base_risk_val + purchase_adj + value_adj) * seasonality_multiplier
    ));
    
    -- Determine risk level
    IF final_risk <= 20 THEN
        risk_level_text := 'Low Risk';
    ELSIF final_risk <= 40 THEN
        risk_level_text := 'Moderate Risk';
    ELSIF final_risk <= 60 THEN
        risk_level_text := 'High Risk';
    ELSE
        risk_level_text := 'Critical Risk';
    END IF;
    
    RETURN QUERY SELECT 
        input_client_id,
        final_risk::INTEGER,
        risk_level_text,
        dsla,
        dslp,
        pl12,
        total_spent_12mo,
        adbp,
        clv,
        seasonal,
        base_risk_val,
        purchase_adj,
        value_adj,
        seasonality_multiplier,
        NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for easy access to churn risk data
CREATE OR REPLACE VIEW client_churn_risk_view AS
SELECT 
    p.id as client_id,
    p.email,
    p.first_name,
    p.last_name,
    cr.risk_score,
    cr.risk_level,
    cr.days_since_last_activity,
    cr.days_since_last_purchase,
    cr.purchase_count_12mo,
    cr.total_spent_12mo,
    cr.avg_purchase_interval,
    cr.lifetime_value,
    cr.is_seasonal,
    cr.calculation_date
FROM profiles p
CROSS JOIN LATERAL calculate_adaptive_churn_risk(p.id) cr
WHERE p.account_type IN ('client', 'white_label');

-- Create a function to get churn risk summary for admin dashboard
CREATE OR REPLACE FUNCTION get_churn_risk_summary()
RETURNS TABLE(
    total_clients INTEGER,
    low_risk_count INTEGER,
    moderate_risk_count INTEGER,
    high_risk_count INTEGER,
    critical_risk_count INTEGER,
    avg_risk_score NUMERIC,
    high_value_at_risk_count INTEGER,
    seasonal_buyers_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_clients,
        COUNT(*) FILTER (WHERE risk_level = 'Low Risk') as low_risk_count,
        COUNT(*) FILTER (WHERE risk_level = 'Moderate Risk') as moderate_risk_count,
        COUNT(*) FILTER (WHERE risk_level = 'High Risk') as high_risk_count,
        COUNT(*) FILTER (WHERE risk_level = 'Critical Risk') as critical_risk_count,
        AVG(risk_score) as avg_risk_score,
        COUNT(*) FILTER (WHERE risk_level IN ('High Risk', 'Critical Risk') AND lifetime_value > 1000) as high_value_at_risk_count,
        COUNT(*) FILTER (WHERE is_seasonal = true) as seasonal_buyers_count
    FROM client_churn_risk_view;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get clients at risk for targeted outreach
CREATE OR REPLACE FUNCTION get_clients_at_risk(risk_threshold INTEGER DEFAULT 40)
RETURNS TABLE(
    client_id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    risk_score INTEGER,
    risk_level TEXT,
    days_since_last_activity INTEGER,
    lifetime_value NUMERIC,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    recommended_action TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        crv.client_id,
        crv.email,
        crv.first_name,
        crv.last_name,
        crv.risk_score,
        crv.risk_level,
        crv.days_since_last_activity,
        crv.lifetime_value,
        (NOW() - (crv.days_since_last_purchase || ' days')::INTERVAL) as last_purchase_date,
        CASE 
            WHEN crv.lifetime_value > 5000 THEN 'High-value client - Personal outreach recommended'
            WHEN crv.risk_score > 70 THEN 'Critical risk - Immediate re-engagement campaign'
            WHEN crv.is_seasonal THEN 'Seasonal buyer - Consider timing of outreach'
            ELSE 'Standard re-engagement campaign'
        END as recommended_action
    FROM client_churn_risk_view crv
    WHERE crv.risk_score >= risk_threshold
    ORDER BY crv.risk_score DESC, crv.lifetime_value DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_proposals_client_created ON sync_proposals(client_id, created_at, payment_status);
CREATE INDEX IF NOT EXISTS idx_custom_sync_client_created ON custom_sync_requests(client_id, created_at, payment_status);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_days_since_last_activity(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_history_12mo(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_lifetime_value(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_seasonal_buyer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_adaptive_churn_risk(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_churn_risk_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_clients_at_risk(INTEGER) TO authenticated;
GRANT SELECT ON client_churn_risk_view TO authenticated;

SELECT 'Adaptive churn risk system implemented successfully. Migration completed.' AS result;
