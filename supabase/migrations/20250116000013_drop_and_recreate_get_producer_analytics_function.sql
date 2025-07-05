-- Migration: Drop and recreate get_producer_analytics with correct return type

DROP FUNCTION IF EXISTS get_producer_analytics();

CREATE OR REPLACE FUNCTION get_producer_analytics()
RETURNS TABLE(
    proposal_producer_id UUID,
    total_tracks BIGINT,
    total_sales BIGINT,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS proposal_producer_id,
        COUNT(DISTINCT t.id) AS total_tracks,
        COUNT(DISTINCT s.id) AS total_sales,
        COALESCE(SUM(s.amount), 0) + COALESCE(SUM(sp.sync_fee), 0) AS total_revenue
    FROM
        profiles p
    LEFT JOIN
        tracks t ON p.id = t.track_producer_id
    LEFT JOIN
        sales s ON t.id = s.track_id
    LEFT JOIN
        sync_proposals sp ON t.id = sp.track_id AND sp.payment_status = 'paid' AND sp.status = 'accepted'
    WHERE
        p.account_type = 'producer'
    GROUP BY
        p.id;
END;
$$ LANGUAGE plpgsql; 