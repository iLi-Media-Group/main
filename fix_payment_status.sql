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