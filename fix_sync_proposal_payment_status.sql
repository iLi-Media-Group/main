-- Comprehensive fix for sync proposal payment status issues
-- This script will fix proposals that are stuck in pending payment status

-- First, let's see the current state of all sync proposals
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
ORDER BY created_at DESC;

-- Fix 1: Update proposals where both parties have accepted but payment_status is not 'paid'
UPDATE sync_proposals 
SET 
    payment_status = 'paid',
    payment_date = NOW(),
    updated_at = NOW()
WHERE client_status = 'accepted' 
  AND producer_status = 'accepted'
  AND (payment_status = 'pending' OR payment_status IS NULL OR payment_status = '');

-- Fix 2: Update proposals where status is 'accepted' but payment_status is not 'paid'
UPDATE sync_proposals 
SET 
    payment_status = 'paid',
    payment_date = NOW(),
    updated_at = NOW()
WHERE status = 'accepted'
  AND (payment_status = 'pending' OR payment_status IS NULL OR payment_status = '')
  AND sync_fee > 0;

-- Fix 3: Update proposals where negotiation_status is 'accepted' but payment_status is not 'paid'
UPDATE sync_proposals 
SET 
    payment_status = 'paid',
    payment_date = NOW(),
    updated_at = NOW()
WHERE negotiation_status = 'accepted'
  AND (payment_status = 'pending' OR payment_status IS NULL OR payment_status = '')
  AND sync_fee > 0;

-- Fix 4: Ensure status and negotiation_status are consistent with acceptance
UPDATE sync_proposals 
SET 
    status = 'accepted',
    negotiation_status = 'accepted',
    updated_at = NOW()
WHERE client_status = 'accepted' 
  AND producer_status = 'accepted'
  AND (status != 'accepted' OR negotiation_status != 'accepted');

-- Fix 5: Update proposals that have payment records in stripe_orders but payment_status is not 'paid'
UPDATE sync_proposals 
SET 
    payment_status = 'paid',
    payment_date = NOW(),
    updated_at = NOW()
WHERE id IN (
    SELECT (metadata->>'proposal_id')::uuid
    FROM stripe_orders 
    WHERE metadata->>'proposal_id' IS NOT NULL
      AND payment_status = 'paid'
      AND status = 'completed'
)
AND (payment_status = 'pending' OR payment_status IS NULL OR payment_status = '');

-- Verify the fixes worked
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
ORDER BY updated_at DESC;

-- Show all proposals that should now appear in the "Paid" tab
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
ORDER BY updated_at DESC;

-- Check if there are any proposals still stuck in pending
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
  AND (payment_status = 'pending' OR payment_status IS NULL OR payment_status = '')
ORDER BY updated_at DESC; 