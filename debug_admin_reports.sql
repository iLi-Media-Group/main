-- Debug Admin Reports SQL Script
-- This script helps verify the data that will be included in admin reports

-- Set date range for testing (last 30 days)
WITH date_range AS (
  SELECT 
    CURRENT_DATE - INTERVAL '30 days' as start_date,
    CURRENT_DATE as end_date
)
SELECT '=== ADMIN REPORT DEBUG ===' as debug_info;

-- 1. Track License Sales
SELECT 
  'Track License Sales' as sales_type,
  COUNT(*) as total_count,
  SUM(amount) as total_revenue,
  MIN(created_at) as earliest_sale,
  MAX(created_at) as latest_sale
FROM sales 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND deleted_at IS NULL;

-- 2. Sync Proposal Sales (paid and accepted)
SELECT 
  'Sync Proposal Sales' as sales_type,
  COUNT(*) as total_count,
  SUM(sync_fee) as total_revenue,
  MIN(created_at) as earliest_sale,
  MAX(created_at) as latest_sale
FROM sync_proposals 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND payment_status = 'paid'
  AND status = 'accepted';

-- 3. Custom Sync Request Sales (completed)
SELECT 
  'Custom Sync Request Sales' as sales_type,
  COUNT(*) as total_count,
  SUM(sync_fee) as total_revenue,
  MIN(created_at) as earliest_sale,
  MAX(created_at) as latest_sale
FROM custom_sync_requests 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND status = 'completed';

-- 4. Sales by Producer (Track Licenses)
SELECT 
  'Track Licenses by Producer' as report_section,
  p.first_name || ' ' || p.last_name as producer_name,
  p.email as producer_email,
  COUNT(s.id) as track_licenses,
  SUM(s.amount) as track_revenue
FROM sales s
JOIN tracks t ON s.track_id = t.id
JOIN profiles p ON t.producer_id = p.id
WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND s.deleted_at IS NULL
GROUP BY p.id, p.first_name, p.last_name, p.email
ORDER BY track_revenue DESC;

-- 5. Sales by Producer (Sync Proposals)
SELECT 
  'Sync Proposals by Producer' as report_section,
  p.first_name || ' ' || p.last_name as producer_name,
  p.email as producer_email,
  COUNT(sp.id) as sync_proposals,
  SUM(sp.sync_fee) as sync_revenue
FROM sync_proposals sp
JOIN tracks t ON sp.track_id = t.id
JOIN profiles p ON t.producer_id = p.id
WHERE sp.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND sp.payment_status = 'paid'
  AND sp.status = 'accepted'
GROUP BY p.id, p.first_name, p.last_name, p.email
ORDER BY sync_revenue DESC;

-- 6. Sales by Producer (Custom Sync Requests)
SELECT 
  'Custom Sync Requests by Producer' as report_section,
  p.first_name || ' ' || p.last_name as producer_name,
  p.email as producer_email,
  COUNT(csr.id) as custom_sync_requests,
  SUM(csr.sync_fee) as custom_sync_revenue
FROM custom_sync_requests csr
JOIN profiles p ON csr.preferred_producer_id = p.id
WHERE csr.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND csr.status = 'completed'
GROUP BY p.id, p.first_name, p.last_name, p.email
ORDER BY custom_sync_revenue DESC;

-- 7. Combined Producer Sales Summary
WITH producer_sales AS (
  -- Track licenses
  SELECT 
    t.producer_id,
    COUNT(s.id) as track_licenses,
    SUM(s.amount) as track_revenue
  FROM sales s
  JOIN tracks t ON s.track_id = t.id
  WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
    AND s.deleted_at IS NULL
  GROUP BY t.producer_id
  
  UNION ALL
  
  -- Sync proposals
  SELECT 
    t.producer_id,
    COUNT(sp.id) as sync_proposals,
    SUM(sp.sync_fee) as sync_revenue
  FROM sync_proposals sp
  JOIN tracks t ON sp.track_id = t.id
  WHERE sp.created_at >= CURRENT_DATE - INTERVAL '30 days'
    AND sp.payment_status = 'paid'
    AND sp.status = 'accepted'
  GROUP BY t.producer_id
  
  UNION ALL
  
  -- Custom sync requests
  SELECT 
    csr.preferred_producer_id as producer_id,
    COUNT(csr.id) as custom_sync_requests,
    SUM(csr.sync_fee) as custom_sync_revenue
  FROM custom_sync_requests csr
  WHERE csr.created_at >= CURRENT_DATE - INTERVAL '30 days'
    AND csr.status = 'completed'
  GROUP BY csr.preferred_producer_id
)
SELECT 
  'Combined Producer Sales Summary' as report_section,
  p.first_name || ' ' || p.last_name as producer_name,
  p.email as producer_email,
  COALESCE(SUM(ps.track_licenses), 0) as total_track_licenses,
  COALESCE(SUM(ps.sync_proposals), 0) as total_sync_proposals,
  COALESCE(SUM(ps.custom_sync_requests), 0) as total_custom_sync_requests,
  COALESCE(SUM(ps.track_revenue), 0) + COALESCE(SUM(ps.sync_revenue), 0) + COALESCE(SUM(ps.custom_sync_revenue), 0) as total_revenue
FROM profiles p
LEFT JOIN producer_sales ps ON p.id = ps.producer_id
WHERE p.account_type = 'producer' 
   OR p.email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com')
GROUP BY p.id, p.first_name, p.last_name, p.email
HAVING COALESCE(SUM(ps.track_licenses), 0) + COALESCE(SUM(ps.sync_proposals), 0) + COALESCE(SUM(ps.custom_sync_requests), 0) > 0
ORDER BY total_revenue DESC;

-- 8. Daily Sales Breakdown
SELECT 
  'Daily Sales Breakdown' as report_section,
  DATE(s.created_at) as sale_date,
  COUNT(s.id) as track_licenses,
  SUM(s.amount) as track_revenue
FROM sales s
WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND s.deleted_at IS NULL
GROUP BY DATE(s.created_at)

UNION ALL

SELECT 
  'Daily Sales Breakdown' as report_section,
  DATE(sp.created_at) as sale_date,
  COUNT(sp.id) as sync_proposals,
  SUM(sp.sync_fee) as sync_revenue
FROM sync_proposals sp
WHERE sp.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND sp.payment_status = 'paid'
  AND sp.status = 'accepted'
GROUP BY DATE(sp.created_at)

UNION ALL

SELECT 
  'Daily Sales Breakdown' as report_section,
  DATE(csr.created_at) as sale_date,
  COUNT(csr.id) as custom_sync_requests,
  SUM(csr.sync_fee) as custom_sync_revenue
FROM custom_sync_requests csr
WHERE csr.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND csr.status = 'completed'
GROUP BY DATE(csr.created_at)

ORDER BY sale_date;

-- 9. Total Summary for Last 30 Days
SELECT 
  'TOTAL SUMMARY (Last 30 Days)' as summary_type,
  (SELECT COUNT(*) FROM sales WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND deleted_at IS NULL) as total_track_licenses,
  (SELECT COUNT(*) FROM sync_proposals WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND payment_status = 'paid' AND status = 'accepted') as total_sync_proposals,
  (SELECT COUNT(*) FROM custom_sync_requests WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND status = 'completed') as total_custom_sync_requests,
  (SELECT COUNT(*) FROM sales WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND deleted_at IS NULL) + 
  (SELECT COUNT(*) FROM sync_proposals WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND payment_status = 'paid' AND status = 'accepted') +
  (SELECT COUNT(*) FROM custom_sync_requests WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND status = 'completed') as total_sales,
  (SELECT COALESCE(SUM(amount), 0) FROM sales WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND deleted_at IS NULL) +
  (SELECT COALESCE(SUM(sync_fee), 0) FROM sync_proposals WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND payment_status = 'paid' AND status = 'accepted') +
  (SELECT COALESCE(SUM(sync_fee), 0) FROM custom_sync_requests WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND status = 'completed') as total_revenue; 