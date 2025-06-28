-- Debug script to check analytics data availability
-- Run this in Supabase SQL editor to see what data exists

-- Check if sales table has any data
SELECT 'SALES TABLE' as table_name, COUNT(*) as record_count FROM sales;

-- Check if sync_proposals table has any data
SELECT 'SYNC_PROPOSALS TABLE' as table_name, COUNT(*) as record_count FROM sync_proposals;

-- Check if custom_sync_requests table has any data
SELECT 'CUSTOM_SYNC_REQUESTS TABLE' as table_name, COUNT(*) as record_count FROM custom_sync_requests;

-- Check if tracks table has any data
SELECT 'TRACKS TABLE' as table_name, COUNT(*) as record_count FROM tracks;

-- Check if profiles table has any data
SELECT 'PROFILES TABLE' as table_name, COUNT(*) as record_count FROM profiles;

-- Check profiles by account type
SELECT 
  account_type,
  COUNT(*) as count
FROM profiles 
GROUP BY account_type;

-- Check recent sales (if any exist)
SELECT 
  'RECENT SALES' as info,
  id,
  track_id,
  buyer_id,
  amount,
  created_at
FROM sales 
ORDER BY created_at DESC 
LIMIT 5;

-- Check recent sync proposals (if any exist)
SELECT 
  'RECENT SYNC PROPOSALS' as info,
  id,
  track_id,
  client_id,
  sync_fee,
  payment_status,
  status,
  created_at
FROM sync_proposals 
ORDER BY created_at DESC 
LIMIT 5;

-- Check recent custom sync requests (if any exist)
SELECT 
  'RECENT CUSTOM SYNC REQUESTS' as info,
  id,
  client_id,
  preferred_producer_id,
  sync_fee,
  status,
  created_at
FROM custom_sync_requests 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if there are any tracks with producers
SELECT 
  'TRACKS WITH PRODUCERS' as info,
  COUNT(*) as total_tracks,
  COUNT(DISTINCT producer_id) as unique_producers
FROM tracks;

-- Check sample tracks
SELECT 
  'SAMPLE TRACKS' as info,
  id,
  title,
  producer_id,
  genres,
  created_at
FROM tracks 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if there are any completed transactions in any table
SELECT 'COMPLETED TRANSACTIONS SUMMARY' as summary;

-- Count paid sync proposals
SELECT 
  'PAID SYNC PROPOSALS' as type,
  COUNT(*) as count,
  SUM(sync_fee) as total_revenue
FROM sync_proposals 
WHERE payment_status = 'paid' AND status = 'accepted';

-- Count completed custom sync requests
SELECT 
  'COMPLETED CUSTOM SYNC REQUESTS' as type,
  COUNT(*) as count,
  SUM(sync_fee) as total_revenue
FROM custom_sync_requests 
WHERE status = 'completed';

-- Count track license sales
SELECT 
  'TRACK LICENSE SALES' as type,
  COUNT(*) as count,
  SUM(amount) as total_revenue
FROM sales 
WHERE deleted_at IS NULL;

-- Show what data will appear in analytics when real transactions occur
SELECT 'EXPECTED ANALYTICS DATA FLOW' as info;

SELECT 
  'When a track license is purchased:' as event,
  '1. Record appears in sales table' as step1,
  '2. Shows in Track License Sales analytics' as step2,
  '3. Contributes to total revenue' as step3;

SELECT 
  'When a sync proposal is paid and accepted:' as event,
  '1. Record appears in sync_proposals table' as step1,
  '2. Shows in Sync Proposal analytics' as step2,
  '3. Contributes to total revenue' as step3;

SELECT 
  'When a custom sync request is completed:' as event,
  '1. Record appears in custom_sync_requests table' as step1,
  '2. Shows in Custom Sync analytics' as step2,
  '3. Contributes to total revenue' as step3; 