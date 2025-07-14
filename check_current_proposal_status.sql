-- Check current sync proposal status
-- Run this in your Supabase SQL Editor to see what's happening

-- Check all sync proposals and their current status
SELECT 
    id,
    status,
    client_status,
    producer_status,
    payment_status,
    negotiation_status,
    sync_fee,
    final_amount,
    created_at,
    updated_at,
    payment_date,
    invoice_id
FROM sync_proposals 
ORDER BY created_at DESC
LIMIT 10;

-- Check specifically for proposals that should be in "Paid" tab
-- These should have client_status = 'accepted', producer_status = 'accepted', and payment_status = 'paid'
SELECT 
    id,
    status,
    client_status,
    producer_status,
    payment_status,
    negotiation_status,
    sync_fee,
    final_amount,
    created_at,
    updated_at,
    payment_date,
    invoice_id
FROM sync_proposals 
WHERE client_status = 'accepted' 
  AND producer_status = 'accepted'
  AND payment_status = 'paid'
ORDER BY created_at DESC;

-- Check for proposals that are stuck in pending payment
SELECT 
    id,
    status,
    client_status,
    producer_status,
    payment_status,
    negotiation_status,
    sync_fee,
    final_amount,
    created_at,
    updated_at,
    payment_date,
    invoice_id
FROM sync_proposals 
WHERE client_status = 'accepted' 
  AND producer_status = 'accepted'
  AND (payment_status = 'pending' OR payment_status IS NULL)
ORDER BY created_at DESC;

-- Check recent stripe orders to see if payments were recorded
SELECT 
    id,
    checkout_session_id,
    payment_intent_id,
    payment_status,
    status,
    metadata,
    created_at
FROM stripe_orders 
WHERE metadata->>'proposal_id' IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any stripe webhook logs for recent events
SELECT 
    id,
    event_type,
    metadata,
    status,
    created_at
FROM stripe_webhook_logs 
ORDER BY created_at DESC
LIMIT 10; 