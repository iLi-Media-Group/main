-- Debug script to check analytics data availability
-- Run this in your Supabase SQL editor to see what data exists

-- 1. Check sales table
SELECT 
  'sales' as table_name,
  COUNT(*) as total_records,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record,
  COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active_records
FROM sales;

-- 2. Check sync_proposals table
SELECT 
  'sync_proposals' as table_name,
  COUNT(*) as total_records,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record,
  COUNT(CASE WHEN payment_status = 'paid' AND status = 'accepted' THEN 1 END) as paid_accepted_records
FROM sync_proposals;

-- 3. Check custom_sync_requests table
SELECT 
  'custom_sync_requests' as table_name,
  COUNT(*) as total_records,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_records
FROM custom_sync_requests;

-- 4. Check recent data (last 30 days)
SELECT 
  'recent_sales' as data_type,
  COUNT(*) as count,
  COALESCE(SUM(amount), 0) as total_revenue
FROM sales 
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND deleted_at IS NULL;

SELECT 
  'recent_sync_proposals' as data_type,
  COUNT(*) as count,
  COALESCE(SUM(sync_fee), 0) as total_revenue
FROM sync_proposals 
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND payment_status = 'paid' 
  AND status = 'accepted';

SELECT 
  'recent_custom_sync' as data_type,
  COUNT(*) as count,
  COALESCE(SUM(sync_fee), 0) as total_revenue
FROM custom_sync_requests 
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND status = 'completed';

-- 5. Check if there are any records at all (no date filter)
SELECT 
  'all_sales' as data_type,
  COUNT(*) as count
FROM sales 
WHERE deleted_at IS NULL;

SELECT 
  'all_sync_proposals' as data_type,
  COUNT(*) as count
FROM sync_proposals 
WHERE payment_status = 'paid' 
  AND status = 'accepted';

SELECT 
  'all_custom_sync' as data_type,
  COUNT(*) as count
FROM custom_sync_requests 
WHERE status = 'completed';

-- 6. Sample some actual records to see the data structure
SELECT 
  'sample_sales' as data_type,
  id,
  amount,
  created_at,
  deleted_at
FROM sales 
WHERE deleted_at IS NULL
LIMIT 3;

SELECT 
  'sample_sync_proposals' as data_type,
  id,
  sync_fee,
  payment_status,
  status,
  created_at
FROM sync_proposals 
WHERE payment_status = 'paid' 
  AND status = 'accepted'
LIMIT 3;

SELECT 
  'sample_custom_sync' as data_type,
  id,
  sync_fee,
  status,
  created_at
FROM custom_sync_requests 
WHERE status = 'completed'
LIMIT 3; 