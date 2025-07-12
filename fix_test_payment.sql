-- Fix test payment status and check payment records
-- Run this in your Supabase SQL Editor

-- First, let's see what proposals exist and their current status
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
ORDER BY created_at DESC;

-- Check stripe_orders table for the payment
SELECT 
    id,
    checkout_session_id,
    payment_intent_id,
    amount_total,
    payment_status,
    status,
    metadata,
    created_at
FROM stripe_orders 
WHERE metadata->>'proposal_id' IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Check all stripe_orders to see what payments exist
SELECT 
    id,
    checkout_session_id,
    payment_intent_id,
    amount_total,
    payment_status,
    status,
    metadata,
    created_at
FROM stripe_orders 
ORDER BY created_at DESC
LIMIT 10;

-- Manually update the payment status for accepted proposals
UPDATE sync_proposals 
SET 
    payment_status = 'paid',
    payment_date = NOW(),
    updated_at = NOW()
WHERE client_status = 'accepted' 
  AND producer_status = 'accepted'
  AND (payment_status = 'pending' OR payment_status IS NULL);

-- Verify the update worked
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