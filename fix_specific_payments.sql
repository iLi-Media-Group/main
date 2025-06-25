-- Fix payment status for specific proposals that are stuck in pending
-- Based on debug output showing proposals with Status: accepted but Payment: pending

-- Fix proposal 7af40356... (Fee: $1300)
UPDATE sync_proposals 
SET 
  payment_status = 'paid',
  payment_date = NOW(),
  updated_at = NOW()
WHERE id = '7af40356-66f3-45d7-87f3-710dff65b46a'
  AND payment_status = 'pending'
  AND status = 'accepted';

-- Fix proposal 6b2c0641... (Fee: $2000)
UPDATE sync_proposals 
SET 
  payment_status = 'paid',
  payment_date = NOW(),
  updated_at = NOW()
WHERE id = '6b2c0641-bae3-4fdb-a43a-e3b0de12b71b'
  AND payment_status = 'pending'
  AND status = 'accepted';

-- Fix proposal 3e7e991d... (Fee: $1500) - only if it's accepted
UPDATE sync_proposals 
SET 
  payment_status = 'paid',
  payment_date = NOW(),
  updated_at = NOW()
WHERE id = '3e7e991d-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  AND payment_status = 'pending'
  AND status = 'accepted';

-- Also fix any other accepted proposals that are stuck in pending
UPDATE sync_proposals 
SET 
  payment_status = 'paid',
  payment_date = NOW(),
  updated_at = NOW()
WHERE payment_status = 'pending' 
  AND status = 'accepted'
  AND sync_fee > 0;

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
WHERE id IN ('7af40356-66f3-45d7-87f3-710dff65b46a', '6b2c0641-bae3-4fdb-a43a-e3b0de12b71b')
ORDER BY updated_at DESC;

-- Show all paid proposals
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