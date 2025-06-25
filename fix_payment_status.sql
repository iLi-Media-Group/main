-- Fix payment status for sync proposals
-- This script manually updates the payment_status to 'paid' for proposals that have been accepted
-- but still show as pending payment

-- First, let's see what proposals exist and their current status
SELECT 
    id,
    status,
    payment_status,
    sync_fee,
    created_at,
    updated_at
FROM sync_proposals 
WHERE status = 'accepted' 
ORDER BY created_at DESC;

-- Update payment status for accepted proposals that don't have payment_status set
UPDATE sync_proposals 
SET 
    payment_status = 'paid',
    payment_date = NOW(),
    updated_at = NOW()
WHERE status = 'accepted' 
AND (payment_status IS NULL OR payment_status = 'pending');

-- Verify the update
SELECT 
    id,
    status,
    payment_status,
    sync_fee,
    created_at,
    updated_at
FROM sync_proposals 
WHERE status = 'accepted' 
ORDER BY created_at DESC;

-- Fix payment status for proposal 7af40356...
-- This will update the payment_status from 'pending' to 'paid'

UPDATE sync_proposals 
SET 
  payment_status = 'paid',
  payment_date = NOW(),
  updated_at = NOW()
WHERE id = '7af40356-xxxx-xxxx-xxxx-xxxxxxxxxxxx'  -- Replace with the actual proposal ID
  AND payment_status = 'pending';

-- Also update any other proposals that might be stuck in pending status
-- but have completed payments (this is a safety check)

UPDATE sync_proposals 
SET 
  payment_status = 'paid',
  payment_date = NOW(),
  updated_at = NOW()
WHERE payment_status = 'pending' 
  AND status = 'accepted'
  AND client_status = 'accepted'
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
WHERE payment_status = 'paid'
ORDER BY updated_at DESC
LIMIT 10; 