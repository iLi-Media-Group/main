-- Debug script to check payment status and help troubleshoot frontend issues

-- First, check what columns actually exist in the sync_proposals table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sync_proposals'
ORDER BY ordinal_position;

-- Check the exact current state of the proposals
SELECT 
  id, 
  status, 
  client_status, 
  payment_status, 
  sync_fee,
  created_at,
  updated_at,
  payment_date
FROM sync_proposals 
WHERE id IN ('7af40356-66f3-45d7-87f3-710dff65b46a', '6b2c0641-bae3-4fdb-a43a-e3b0de12b71b')
ORDER BY updated_at DESC;

-- Check if there are any other proposals with similar issues
SELECT 
  id, 
  status, 
  client_status, 
  payment_status, 
  sync_fee,
  created_at,
  updated_at
FROM sync_proposals 
WHERE payment_status = 'paid'
ORDER BY updated_at DESC
LIMIT 10;

-- Check for any proposals that might be stuck
SELECT 
  id, 
  status, 
  client_status, 
  payment_status, 
  sync_fee,
  created_at,
  updated_at
FROM sync_proposals 
WHERE status = 'accepted' 
  AND payment_status = 'pending'
ORDER BY updated_at DESC;

-- Test direct query as the authenticated user (this simulates what the frontend sees)
-- Run this as the authenticated user to see if RLS is blocking the payment_status
SELECT 
  id, 
  status, 
  client_status, 
  payment_status, 
  sync_fee,
  created_at,
  updated_at
FROM sync_proposals 
WHERE client_id = auth.uid()
  AND id IN ('7af40356-66f3-45d7-87f3-710dff65b46a', '6b2c0641-bae3-4fdb-a43a-e3b0de12b71b')
ORDER BY updated_at DESC; 