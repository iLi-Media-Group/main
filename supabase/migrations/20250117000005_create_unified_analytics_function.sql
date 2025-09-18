-- Create unified analytics function for both producers and artists
-- This function handles track counting for both account types

CREATE OR REPLACE FUNCTION get_user_analytics()
RETURNS TABLE(
    user_id UUID,
    total_tracks BIGINT,
    total_sales BIGINT,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    -- Analytics for producers (using track_producer_id)
    SELECT
        p.id AS user_id,
        COUNT(DISTINCT t.id) AS total_tracks,
        COUNT(DISTINCT s.id) + COUNT(DISTINCT sp.id) + COUNT(DISTINCT csr.id) AS total_sales,
        COALESCE(SUM(s.amount), 0) + 
        COALESCE(SUM(COALESCE(sp.final_amount, sp.negotiated_amount, sp.sync_fee)), 0) + 
        COALESCE(SUM(COALESCE(csr.final_amount, csr.negotiated_amount, csr.sync_fee)), 0) AS total_revenue
    FROM
        profiles p
    LEFT JOIN
        tracks t ON p.id = t.track_producer_id
    LEFT JOIN
        sales s ON t.id = s.track_id
    LEFT JOIN
        sync_proposals sp ON t.id = sp.track_id AND sp.payment_status = 'paid' AND sp.status = 'accepted'
    LEFT JOIN
        custom_sync_requests csr ON p.id = csr.preferred_producer_id AND csr.status = 'completed'
    WHERE
        p.account_type = 'producer'
    GROUP BY
        p.id
    
    UNION ALL
    
    -- Analytics for artists (using roster_entity_id)
    SELECT
        p.id AS user_id,
        COUNT(DISTINCT t.id) AS total_tracks,
        COUNT(DISTINCT s.id) + COUNT(DISTINCT sp.id) + COUNT(DISTINCT csr.id) AS total_sales,
        COALESCE(SUM(s.amount), 0) + 
        COALESCE(SUM(COALESCE(sp.final_amount, sp.negotiated_amount, sp.sync_fee)), 0) + 
        COALESCE(SUM(COALESCE(csr.final_amount, csr.negotiated_amount, csr.sync_fee)), 0) AS total_revenue
    FROM
        profiles p
    LEFT JOIN
        roster_entities re ON p.id = re.rights_holder_id
    LEFT JOIN
        tracks t ON re.id = t.roster_entity_id
    LEFT JOIN
        sales s ON t.id = s.track_id
    LEFT JOIN
        sync_proposals sp ON t.id = sp.track_id AND sp.payment_status = 'paid' AND sp.status = 'accepted'
    LEFT JOIN
        custom_sync_requests csr ON p.id = csr.preferred_producer_id AND csr.status = 'completed'
    WHERE
        p.account_type = 'artist_band'
    GROUP BY
        p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;