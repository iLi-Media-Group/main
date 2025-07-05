-- Fix script for sync proposals stuck in payment pending status
-- Run this in your Supabase SQL Editor to fix the issue

-- First, let's see what proposals are stuck
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
  AND (payment_status = 'pending' OR payment_status IS NULL);

-- Fix all accepted proposals that are stuck in pending payment status
UPDATE sync_proposals 
SET 
    payment_status = 'paid',
    payment_date = NOW(),
    updated_at = NOW()
WHERE client_status = 'accepted' 
  AND producer_status = 'accepted'
  AND (payment_status = 'pending' OR payment_status IS NULL);

-- Also fix any proposals that have status = 'accepted' but payment_status is not 'paid'
UPDATE sync_proposals 
SET 
    payment_status = 'paid',
    payment_date = NOW(),
    updated_at = NOW()
WHERE status = 'accepted'
  AND payment_status != 'paid'
  AND sync_fee > 0;

-- Verify the fix worked
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
WHERE client_status = 'accepted' 
  AND producer_status = 'accepted'
ORDER BY updated_at DESC;

-- Show all proposals with payment_status = 'paid'
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