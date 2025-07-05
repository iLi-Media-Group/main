-- Diagnostic script to check sync proposal status
-- Run this in your Supabase SQL Editor to see the current state

-- Check all sync proposals and their current status
SELECT 
    id,
    status,
    client_status,
    producer_status,
    payment_status,
    sync_fee,
    final_amount,
    created_at,
    updated_at,
    payment_date,
    invoice_id
FROM sync_proposals 
ORDER BY created_at DESC;

-- Check specifically for proposals that are accepted but payment is pending
SELECT 
    id,
    status,
    client_status,
    producer_status,
    payment_status,
    sync_fee,
    final_amount,
    created_at,
    updated_at
FROM sync_proposals 
WHERE client_status = 'accepted' 
  AND producer_status = 'accepted'
  AND (payment_status = 'pending' OR payment_status IS NULL)
ORDER BY created_at DESC;

-- Check for any proposals with payment_status = 'paid'
SELECT 
    id,
    status,
    client_status,
    producer_status,
    payment_status,
    sync_fee,
    final_amount,
    created_at,
    updated_at,
    payment_date
FROM sync_proposals 
WHERE payment_status = 'paid'
ORDER BY updated_at DESC; 