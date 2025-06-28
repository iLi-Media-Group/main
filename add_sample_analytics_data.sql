-- Add sample data for testing analytics using actual track IDs
-- This will create sample sales, sync proposals, and custom sync requests

-- First, let's check what profiles and tracks we have to work with
SELECT 'CHECKING EXISTING DATA' as info;

SELECT 'EXISTING TRACKS:' as info;
SELECT id, title FROM tracks;

SELECT 'EXISTING PROFILES:' as info;
SELECT id, email, account_type FROM profiles LIMIT 10;

-- Now let's add sample data using the actual track IDs we found
-- Track IDs: 
-- 891110d2-d067-4622-b436-49a6a1ba98a9 (Winning - test upload only)
-- ab0dd8b5-1a83-4ca6-b243-9a0a6517c59e (Test Track 2)
-- 728f7f4d-7c9c-4fb6-ac2e-a3cec0872e13 (test 3)

-- Step 1: Get some profile IDs to use (we'll use the first few profiles)
-- Replace these with actual profile IDs from your database
-- For now, we'll create a temporary table to store the IDs we need

-- Create a temporary table to store the profile IDs we'll use
CREATE TEMP TABLE temp_profiles AS
SELECT id, email, account_type FROM profiles LIMIT 5;

-- Show what profiles we're working with
SELECT 'PROFILES TO USE:' as info;
SELECT * FROM temp_profiles;

-- Add sample track license sales using actual track IDs
-- Note: We'll use the first profile as buyer and second as producer
INSERT INTO sales (
  track_id,
  buyer_id,
  license_type,
  amount,
  payment_method,
  transaction_id,
  created_at,
  licensee_info,
  producer_id
) 
SELECT 
  '891110d2-d067-4622-b436-49a6a1ba98a9' as track_id,
  p1.id as buyer_id,
  'exclusive' as license_type,
  299.99 as amount,
  'stripe' as payment_method,
  'txn_sample_001' as transaction_id,
  NOW() - INTERVAL '2 days' as created_at,
  '{"company": "Sample Studio"}' as licensee_info,
  p2.id as producer_id
FROM temp_profiles p1, temp_profiles p2 
WHERE p1.id != p2.id 
LIMIT 1;

INSERT INTO sales (
  track_id,
  buyer_id,
  license_type,
  amount,
  payment_method,
  transaction_id,
  created_at,
  licensee_info,
  producer_id
) 
SELECT 
  'ab0dd8b5-1a83-4ca6-b243-9a0a6517c59e' as track_id,
  p1.id as buyer_id,
  'non_exclusive' as license_type,
  149.99 as amount,
  'stripe' as payment_method,
  'txn_sample_002' as transaction_id,
  NOW() - INTERVAL '5 days' as created_at,
  '{"company": "Music Label"}' as licensee_info,
  p2.id as producer_id
FROM temp_profiles p1, temp_profiles p2 
WHERE p1.id != p2.id 
LIMIT 1;

INSERT INTO sales (
  track_id,
  buyer_id,
  license_type,
  amount,
  payment_method,
  transaction_id,
  created_at,
  licensee_info,
  producer_id
) 
SELECT 
  '728f7f4d-7c9c-4fb6-ac2e-a3cec0872e13' as track_id,
  p1.id as buyer_id,
  'exclusive' as license_type,
  399.99 as amount,
  'stripe' as payment_method,
  'txn_sample_003' as transaction_id,
  NOW() - INTERVAL '10 days' as created_at,
  '{"company": "Film Studio"}' as licensee_info,
  p2.id as producer_id
FROM temp_profiles p1, temp_profiles p2 
WHERE p1.id != p2.id 
LIMIT 1;

-- Add sample sync proposals using actual track IDs
INSERT INTO sync_proposals (
  track_id,
  client_id,
  sync_fee,
  payment_status,
  status,
  created_at
) 
SELECT 
  '891110d2-d067-4622-b436-49a6a1ba98a9' as track_id,
  p1.id as client_id,
  250.00 as sync_fee,
  'paid' as payment_status,
  'accepted' as status,
  NOW() - INTERVAL '3 days' as created_at
FROM temp_profiles p1 
LIMIT 1;

INSERT INTO sync_proposals (
  track_id,
  client_id,
  sync_fee,
  payment_status,
  status,
  created_at
) 
SELECT 
  'ab0dd8b5-1a83-4ca6-b243-9a0a6517c59e' as track_id,
  p1.id as client_id,
  175.00 as sync_fee,
  'paid' as payment_status,
  'accepted' as status,
  NOW() - INTERVAL '7 days' as created_at
FROM temp_profiles p1 
LIMIT 1;

INSERT INTO sync_proposals (
  track_id,
  client_id,
  sync_fee,
  payment_status,
  status,
  created_at
) 
SELECT 
  '728f7f4d-7c9c-4fb6-ac2e-a3cec0872e13' as track_id,
  p1.id as client_id,
  300.00 as sync_fee,
  'paid' as payment_status,
  'accepted' as status,
  NOW() - INTERVAL '12 days' as created_at
FROM temp_profiles p1 
LIMIT 1;

-- Add sample custom sync requests
INSERT INTO custom_sync_requests (
  client_id,
  preferred_producer_id,
  sync_fee,
  status,
  created_at
) 
SELECT 
  p1.id as client_id,
  p2.id as preferred_producer_id,
  400.00 as sync_fee,
  'completed' as status,
  NOW() - INTERVAL '4 days' as created_at
FROM temp_profiles p1, temp_profiles p2 
WHERE p1.id != p2.id 
LIMIT 1;

INSERT INTO custom_sync_requests (
  client_id,
  preferred_producer_id,
  sync_fee,
  status,
  created_at
) 
SELECT 
  p1.id as client_id,
  p2.id as preferred_producer_id,
  275.00 as sync_fee,
  'completed' as status,
  NOW() - INTERVAL '8 days' as created_at
FROM temp_profiles p1, temp_profiles p2 
WHERE p1.id != p2.id 
LIMIT 1;

INSERT INTO custom_sync_requests (
  client_id,
  preferred_producer_id,
  sync_fee,
  status,
  created_at
) 
SELECT 
  p1.id as client_id,
  p2.id as preferred_producer_id,
  325.00 as sync_fee,
  'completed' as status,
  NOW() - INTERVAL '14 days' as created_at
FROM temp_profiles p1, temp_profiles p2 
WHERE p1.id != p2.id 
LIMIT 1;

-- Clean up temporary table
DROP TABLE temp_profiles;

-- Verify the data was added
SELECT 'VERIFICATION - SALES' as info;
SELECT COUNT(*) as total_sales FROM sales;

SELECT 'VERIFICATION - SYNC PROPOSALS' as info;
SELECT COUNT(*) as total_sync_proposals FROM sync_proposals WHERE payment_status = 'paid' AND status = 'accepted';

SELECT 'VERIFICATION - CUSTOM SYNC REQUESTS' as info;
SELECT COUNT(*) as total_custom_sync_requests FROM custom_sync_requests WHERE status = 'completed';

-- Show total revenue
SELECT 'TOTAL REVENUE SUMMARY' as info;
SELECT 
  'Track Sales' as type,
  COUNT(*) as count,
  SUM(amount) as revenue
FROM sales 
WHERE deleted_at IS NULL
UNION ALL
SELECT 
  'Sync Proposals' as type,
  COUNT(*) as count,
  SUM(sync_fee) as revenue
FROM sync_proposals 
WHERE payment_status = 'paid' AND status = 'accepted'
UNION ALL
SELECT 
  'Custom Sync Requests' as type,
  COUNT(*) as count,
  SUM(sync_fee) as revenue
FROM custom_sync_requests 
WHERE status = 'completed';

-- Show recent data
SELECT 'RECENT SALES' as info;
SELECT 
  s.id,
  s.track_id,
  t.title as track_title,
  s.amount,
  s.created_at
FROM sales s
JOIN tracks t ON s.track_id = t.id
ORDER BY s.created_at DESC
LIMIT 5; 