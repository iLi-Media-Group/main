-- Fix Producer Analytics Function to Include All Sales Types Correctly
-- The issue: get_producer_analytics() function is not correctly including custom sync requests
-- It should use selected_producer_id for completed custom sync requests, not preferred_producer_id

-- 1. First, let's see what the current function returns
SELECT * FROM get_producer_analytics();

-- 2. Let's check the current data to understand what should be included
SELECT 
    p.id as producer_id,
    p.email,
    p.first_name,
    p.last_name,
    COUNT(DISTINCT t.id) as total_tracks,
    COUNT(DISTINCT s.id) as track_sales_count,
    COALESCE(SUM(s.amount), 0) as track_sales_revenue,
    COUNT(DISTINCT sp.id) as sync_proposals_count,
    COALESCE(SUM(COALESCE(sp.final_amount, sp.negotiated_amount, sp.sync_fee)), 0) as sync_proposals_revenue,
    COUNT(DISTINCT csr.id) as custom_sync_count,
    COALESCE(SUM(COALESCE(csr.final_amount, csr.negotiated_amount, csr.sync_fee)), 0) as custom_sync_revenue
FROM profiles p
LEFT JOIN tracks t ON p.id = t.track_producer_id
LEFT JOIN sales s ON t.id = s.track_id
LEFT JOIN sync_proposals sp ON t.id = sp.track_id AND sp.payment_status = 'paid' AND sp.status = 'accepted'
LEFT JOIN custom_sync_requests csr ON p.id = csr.selected_producer_id AND csr.payment_status = 'paid'
WHERE p.account_type = 'producer'
GROUP BY p.id, p.email, p.first_name, p.last_name
ORDER BY (COALESCE(SUM(s.amount), 0) + COALESCE(SUM(COALESCE(sp.final_amount, sp.negotiated_amount, sp.sync_fee)), 0) + COALESCE(SUM(COALESCE(csr.final_amount, csr.negotiated_amount, csr.sync_fee)), 0)) DESC;

-- 3. Fix the get_producer_analytics function
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
        custom_sync_requests csr ON p.id = csr.selected_producer_id AND csr.payment_status = 'paid'
    WHERE
        p.account_type = 'producer'
    GROUP BY
        p.id;
END;
$$ LANGUAGE plpgsql;

-- 4. Test the fixed function
SELECT * FROM get_producer_analytics();

-- 5. Verify the fix by comparing with manual calculation
SELECT 
    'Manual Calculation' as source,
    p.id as producer_id,
    p.email,
    COUNT(DISTINCT t.id) as total_tracks,
    COUNT(DISTINCT s.id) + COUNT(DISTINCT sp.id) + COUNT(DISTINCT csr.id) as total_sales,
    COALESCE(SUM(s.amount), 0) + 
    COALESCE(SUM(COALESCE(sp.final_amount, sp.negotiated_amount, sp.sync_fee)), 0) + 
    COALESCE(SUM(COALESCE(csr.final_amount, csr.negotiated_amount, csr.sync_fee)), 0) as total_revenue
FROM profiles p
LEFT JOIN tracks t ON p.id = t.track_producer_id
LEFT JOIN sales s ON t.id = s.track_id
LEFT JOIN sync_proposals sp ON t.id = sp.track_id AND sp.payment_status = 'paid' AND sp.status = 'accepted'
LEFT JOIN custom_sync_requests csr ON p.id = csr.selected_producer_id AND csr.payment_status = 'paid'
WHERE p.account_type = 'producer'
GROUP BY p.id, p.email
ORDER BY (COALESCE(SUM(s.amount), 0) + COALESCE(SUM(COALESCE(sp.final_amount, sp.negotiated_amount, sp.sync_fee)), 0) + COALESCE(SUM(COALESCE(csr.final_amount, csr.negotiated_amount, csr.sync_fee)), 0)) DESC;

-- 6. Show breakdown by sales type for verification
SELECT 
    p.email,
    'Track Sales' as sales_type,
    COUNT(DISTINCT s.id) as count,
    COALESCE(SUM(s.amount), 0) as revenue
FROM profiles p
LEFT JOIN tracks t ON p.id = t.track_producer_id
LEFT JOIN sales s ON t.id = s.track_id
WHERE p.account_type = 'producer'
GROUP BY p.id, p.email
HAVING COUNT(DISTINCT s.id) > 0

UNION ALL

SELECT 
    p.email,
    'Sync Proposals' as sales_type,
    COUNT(DISTINCT sp.id) as count,
    COALESCE(SUM(COALESCE(sp.final_amount, sp.negotiated_amount, sp.sync_fee)), 0) as revenue
FROM profiles p
LEFT JOIN tracks t ON p.id = t.track_producer_id
LEFT JOIN sync_proposals sp ON t.id = sp.track_id AND sp.payment_status = 'paid' AND sp.status = 'accepted'
WHERE p.account_type = 'producer'
GROUP BY p.id, p.email
HAVING COUNT(DISTINCT sp.id) > 0

UNION ALL

SELECT 
    p.email,
    'Custom Sync Requests' as sales_type,
    COUNT(DISTINCT csr.id) as count,
    COALESCE(SUM(COALESCE(csr.final_amount, csr.negotiated_amount, csr.sync_fee)), 0) as revenue
FROM profiles p
LEFT JOIN custom_sync_requests csr ON p.id = csr.selected_producer_id AND csr.payment_status = 'paid'
WHERE p.account_type = 'producer'
GROUP BY p.id, p.email
HAVING COUNT(DISTINCT csr.id) > 0

ORDER BY email, sales_type;

-- 7. Summary
SELECT 'PRODUCER ANALYTICS FUNCTION FIXED' as status;
