-- Quick fix for payment status - run this directly in Supabase SQL Editor

-- Fix the two accepted proposals that are stuck in pending
UPDATE sync_proposals 
SET 
  payment_status = 'paid',
  payment_date = NOW(),
  updated_at = NOW()
WHERE id IN ('7af40356-66f3-45d7-87f3-710dff65b46a', '6b2c0641-bae3-4fdb-a43a-e3b0de12b71b')
  AND payment_status = 'pending'
  AND status = 'accepted';

-- Check the results
SELECT 
  id, 
  status, 
  client_status, 
  payment_status, 
  sync_fee,
  created_at,
  updated_at
FROM sync_proposals 
WHERE id IN ('7af40356-66f3-45d7-87f3-710dff65b46a', '6b2c0641-bae3-4fdb-a43a-e3b0de12b71b'); 