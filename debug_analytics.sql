-- Debug Analytics Data
-- Run this in Supabase SQL Editor to check current data

-- 1. Check profiles table for producers
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

-- 2. Check total count of producers
SELECT 
  COUNT(*) as total_producers,
  COUNT(CASE WHEN account_type = 'producer' THEN 1 END) as explicit_producers,
  COUNT(CASE WHEN email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com') THEN 1 END) as admin_producers
FROM profiles 
WHERE account_type = 'producer' 
   OR email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com');

-- 3. Check current month sales data
SELECT 
  'Track Sales' as source,
  COUNT(*) as count,
  COALESCE(SUM(amount), 0) as total_amount
FROM sales 
WHERE created_at >= date_trunc('month', now())
  AND created_at < date_trunc('month', now()) + interval '1 month'
UNION ALL
SELECT 
  'Sync Proposals' as source,
  COUNT(*) as count,
  COALESCE(SUM(sync_fee), 0) as total_amount
FROM sync_proposals 
WHERE created_at >= date_trunc('month', now())
  AND created_at < date_trunc('month', now()) + interval '1 month'
  AND payment_status = 'paid' 
  AND status = 'accepted'
UNION ALL
SELECT 
  'Custom Sync Requests' as source,
  COUNT(*) as count,
  COALESCE(SUM(sync_fee), 0) as total_amount
FROM custom_sync_requests 
WHERE created_at >= date_trunc('month', now())
  AND created_at < date_trunc('month', now()) + interval '1 month'
  AND status = 'completed';

-- 4. Check if get_producer_analytics function exists and works
SELECT 
  p.id,
  p.email,
  p.account_type,
  COALESCE(pa.total_tracks, 0) as total_tracks,
  COALESCE(pa.total_sales, 0) as total_sales,
  COALESCE(pa.total_revenue, 0) as total_revenue
FROM profiles p
LEFT JOIN LATERAL (
  SELECT * FROM get_producer_analytics() 
  WHERE producer_id = p.id
) pa ON true
WHERE p.account_type = 'producer' 
   OR p.email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com')
ORDER BY pa.total_revenue DESC NULLS LAST;

-- 5. Check if sales_analytics materialized view exists and has data
SELECT 
  'sales_analytics_view' as check_type,
  COUNT(*) as row_count,
  MAX(month) as latest_month,
  COALESCE(SUM(monthly_sales_count), 0) as total_sales_count,
  COALESCE(SUM(monthly_revenue), 0) as total_revenue
FROM sales_analytics;

-- 6. Check recent sales data (last 30 days)
SELECT 
  s.id,
  s.amount,
  s.license_type,
  s.created_at,
  t.title as track_title,
  p.email as producer_email
FROM sales s
JOIN tracks t ON s.track_id = t.id
JOIN profiles p ON t.producer_id = p.id
WHERE s.created_at >= now() - interval '30 days'
ORDER BY s.created_at DESC
LIMIT 10;

-- 7. Check recent sync proposals
SELECT 
  sp.id,
  sp.sync_fee,
  sp.status,
  sp.payment_status,
  sp.created_at,
  t.title as track_title,
  p.email as producer_email
FROM sync_proposals sp
JOIN tracks t ON sp.track_id = t.id
JOIN profiles p ON t.producer_id = p.id
WHERE sp.created_at >= now() - interval '30 days'
ORDER BY sp.created_at DESC
LIMIT 10; 