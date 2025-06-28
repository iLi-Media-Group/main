-- Debug Producer Analytics
-- Run this in Supabase SQL Editor to check producer data

-- 1. Check all profiles that should be considered producers
SELECT 
  id, 
  email, 
  account_type, 
  first_name, 
  last_name,
  producer_number,
  created_at
FROM profiles 
WHERE account_type = 'producer' 
   OR email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com')
ORDER BY created_at;

-- 2. Check if tracks exist and their producer relationships
SELECT 
  t.id as track_id,
  t.title as track_title,
  t.producer_id,
  p.email as producer_email,
  p.account_type,
  t.created_at as track_created_at
FROM tracks t
LEFT JOIN profiles p ON t.producer_id = p.id
ORDER BY t.created_at DESC
LIMIT 20;

-- 3. Check if sales exist and their track relationships
SELECT 
  s.id as sale_id,
  s.amount,
  s.license_type,
  s.created_at as sale_created_at,
  t.id as track_id,
  t.title as track_title,
  t.producer_id,
  p.email as producer_email
FROM sales s
LEFT JOIN tracks t ON s.track_id = t.id
LEFT JOIN profiles p ON t.producer_id = p.id
ORDER BY s.created_at DESC
LIMIT 20;

-- 4. Check if sync proposals exist and their track relationships
SELECT 
  sp.id as proposal_id,
  sp.sync_fee,
  sp.status,
  sp.payment_status,
  sp.created_at as proposal_created_at,
  t.id as track_id,
  t.title as track_title,
  t.producer_id,
  p.email as producer_email
FROM sync_proposals sp
LEFT JOIN tracks t ON sp.track_id = t.id
LEFT JOIN profiles p ON t.producer_id = p.id
ORDER BY sp.created_at DESC
LIMIT 20;

-- 5. Test the get_producer_analytics function directly
SELECT * FROM get_producer_analytics();

-- 6. Check producer analytics with manual query (including admin emails)
SELECT 
  p.id,
  p.email,
  p.account_type,
  COUNT(DISTINCT t.id) as total_tracks,
  COUNT(DISTINCT s.id) + COUNT(DISTINCT sp.id) + COUNT(DISTINCT csr.id) as total_sales,
  COALESCE(SUM(s.amount), 0) + COALESCE(SUM(sp.sync_fee), 0) + COALESCE(SUM(csr.sync_fee), 0) as total_revenue
FROM profiles p
LEFT JOIN tracks t ON p.id = t.producer_id
LEFT JOIN sales s ON t.id = s.track_id
LEFT JOIN sync_proposals sp ON t.id = sp.track_id AND sp.payment_status = 'paid' AND sp.status = 'accepted'
LEFT JOIN custom_sync_requests csr ON p.id = csr.preferred_producer_id AND csr.status = 'completed'
WHERE p.account_type = 'producer' 
   OR p.email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com')
GROUP BY p.id, p.email, p.account_type
ORDER BY total_revenue DESC;

-- 7. Check if there are any tracks at all
SELECT COUNT(*) as total_tracks FROM tracks;

-- 8. Check if there are any sales at all
SELECT COUNT(*) as total_sales FROM sales;

-- 9. Check if there are any sync proposals at all
SELECT COUNT(*) as total_sync_proposals FROM sync_proposals;

-- 10. Check if there are any paid sync proposals
SELECT 
  COUNT(*) as total_paid_proposals,
  COALESCE(SUM(sync_fee), 0) as total_sync_revenue
FROM sync_proposals 
WHERE payment_status = 'paid' AND status = 'accepted';

-- 11. Check if there are any completed custom sync requests
SELECT 
  COUNT(*) as total_completed_custom_syncs,
  COALESCE(SUM(sync_fee), 0) as total_custom_sync_revenue
FROM custom_sync_requests 
WHERE status = 'completed';

-- 12. Check custom sync requests with preferred producers
SELECT 
  csr.id,
  csr.sync_fee,
  csr.status,
  csr.created_at,
  p.email as preferred_producer_email,
  p.account_type as producer_account_type
FROM custom_sync_requests csr
LEFT JOIN profiles p ON csr.preferred_producer_id = p.id
WHERE csr.status = 'completed'
ORDER BY csr.created_at DESC
LIMIT 10; 