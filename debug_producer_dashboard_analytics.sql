-- Debug script for Producer Dashboard Analytics
-- This script helps verify that the Producer Dashboard is correctly calculating
-- total sales and revenue including track licenses, sync proposals, and custom sync requests

-- Replace 'PRODUCER_EMAIL_HERE' with the actual producer email you want to debug
-- Example: 'knockriobeats@gmail.com'

-- 1. Get producer ID
SELECT 
    id as producer_id,
    email,
    first_name,
    last_name
FROM profiles 
WHERE email = 'PRODUCER_EMAIL_HERE' 
AND account_type = 'producer';

-- 2. Track sales (from sales table)
SELECT 
    'Track Sales' as source,
    COUNT(*) as sales_count,
    COALESCE(SUM(amount), 0) as total_revenue
FROM sales s
JOIN tracks t ON s.track_id = t.id
JOIN profiles p ON t.track_producer_id = p.id
WHERE p.email = 'PRODUCER_EMAIL_HERE'
AND s.deleted_at IS NULL
AND t.deleted_at IS NULL;

-- 3. Sync proposals (from sync_proposals table)
SELECT 
    'Sync Proposals' as source,
    COUNT(*) as sales_count,
    COALESCE(SUM(sync_fee), 0) as total_revenue
FROM sync_proposals sp
JOIN tracks t ON sp.track_id = t.id
JOIN profiles p ON t.track_producer_id = p.id
WHERE p.email = 'PRODUCER_EMAIL_HERE'
AND sp.payment_status = 'paid'
AND sp.status = 'accepted';

-- 4. Custom sync requests (from custom_sync_requests table)
SELECT 
    'Custom Sync Requests' as source,
    COUNT(*) as sales_count,
    COALESCE(SUM(sync_fee), 0) as total_revenue
FROM custom_sync_requests csr
JOIN profiles p ON csr.preferred_producer_id = p.id
WHERE p.email = 'PRODUCER_EMAIL_HERE'
AND csr.status = 'completed';

-- 5. Summary totals
WITH track_sales AS (
    SELECT 
        COUNT(*) as sales_count,
        COALESCE(SUM(amount), 0) as total_revenue
    FROM sales s
    JOIN tracks t ON s.track_id = t.id
    JOIN profiles p ON t.track_producer_id = p.id
    WHERE p.email = 'PRODUCER_EMAIL_HERE'
    AND s.deleted_at IS NULL
    AND t.deleted_at IS NULL
),
sync_proposals AS (
    SELECT 
        COUNT(*) as sales_count,
        COALESCE(SUM(sync_fee), 0) as total_revenue
    FROM sync_proposals sp
    JOIN tracks t ON sp.track_id = t.id
    JOIN profiles p ON t.track_producer_id = p.id
    WHERE p.email = 'PRODUCER_EMAIL_HERE'
    AND sp.payment_status = 'paid'
    AND sp.status = 'accepted'
),
custom_sync AS (
    SELECT 
        COUNT(*) as sales_count,
        COALESCE(SUM(sync_fee), 0) as total_revenue
    FROM custom_sync_requests csr
    JOIN profiles p ON csr.preferred_producer_id = p.id
    WHERE p.email = 'PRODUCER_EMAIL_HERE'
    AND csr.status = 'completed'
)
SELECT 
    'TOTAL' as source,
    (ts.sales_count + sp.sales_count + cs.sales_count) as total_sales,
    (ts.total_revenue + sp.total_revenue + cs.total_revenue) as total_revenue
FROM track_sales ts, sync_proposals sp, custom_sync cs;

-- 6. Track count
SELECT 
    COUNT(*) as total_tracks
FROM tracks t
JOIN profiles p ON t.track_producer_id = p.id
WHERE p.email = 'PRODUCER_EMAIL_HERE'
AND t.deleted_at IS NULL;

-- 7. Pending proposals count
SELECT 
    COUNT(*) as pending_proposals
FROM sync_proposals sp
JOIN tracks t ON sp.track_id = t.id
JOIN profiles p ON t.track_producer_id = p.id
WHERE p.email = 'PRODUCER_EMAIL_HERE'
AND (sp.producer_status = 'pending' OR sp.producer_status = 'producer_accepted');

-- 8. Producer balance
SELECT 
    pending_balance,
    available_balance,
    lifetime_earnings
FROM producer_balances pb
JOIN profiles p ON pb.balance_producer_id = p.id
WHERE p.email = 'PRODUCER_EMAIL_HERE'; 