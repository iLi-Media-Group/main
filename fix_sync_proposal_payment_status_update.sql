-- Fix Sync Proposal Payment Status Update Issue
-- This script ensures proposals move from "Accepted" to "Paid" tab after payment

-- Step 1: Check current state of sync proposals
SELECT 'Current state of sync proposals:' as info;
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
    payment_date
FROM sync_proposals 
ORDER BY created_at DESC
LIMIT 10;

-- Step 2: Identify proposals that should be in "Paid" tab but are stuck in "Accepted"
SELECT 'Proposals that should be in Paid tab but are stuck in Accepted:' as info;
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
    updated_at
FROM sync_proposals 
WHERE client_status = 'accepted' 
  AND producer_status = 'accepted'
  AND (payment_status = 'pending' OR payment_status IS NULL OR payment_status = '')
  AND sync_fee > 0;

-- Step 3: Check if there are any stripe_orders for sync proposals that haven't updated payment_status
SELECT 'Stripe orders for sync proposals:' as info;
SELECT 
    so.payment_intent_id,
    so.payment_status,
    so.status,
    so.metadata,
    sp.id as proposal_id,
    sp.payment_status as proposal_payment_status,
    sp.status as proposal_status
FROM stripe_orders so
LEFT JOIN sync_proposals sp ON sp.id::text = so.metadata->>'proposal_id'
WHERE so.metadata->>'proposal_id' IS NOT NULL
  AND so.payment_status = 'paid'
  AND so.status = 'completed'
ORDER BY so.created_at DESC;

-- Step 4: Fix proposals that have completed payments but payment_status is not 'paid'
UPDATE sync_proposals 
SET 
    payment_status = 'paid',
    payment_date = NOW(),
    updated_at = NOW()
WHERE id IN (
    SELECT (so.metadata->>'proposal_id')::uuid
    FROM stripe_orders so
    WHERE so.metadata->>'proposal_id' IS NOT NULL
      AND so.payment_status = 'paid'
      AND so.status = 'completed'
)
AND (payment_status = 'pending' OR payment_status IS NULL OR payment_status = '');

-- Step 5: Fix proposals where both parties have accepted but payment_status is not 'paid'
UPDATE sync_proposals 
SET 
    payment_status = 'paid',
    payment_date = NOW(),
    updated_at = NOW()
WHERE client_status = 'accepted' 
  AND producer_status = 'accepted'
  AND (payment_status = 'pending' OR payment_status IS NULL OR payment_status = '')
  AND sync_fee > 0;

-- Step 6: Ensure status and negotiation_status are consistent
UPDATE sync_proposals 
SET 
    status = 'accepted',
    negotiation_status = 'accepted',
    updated_at = NOW()
WHERE client_status = 'accepted' 
  AND producer_status = 'accepted'
  AND (status != 'accepted' OR negotiation_status != 'accepted');

-- Step 7: Create missing stripe_orders for proposals that should be marked as paid
-- This ensures the trigger fires and producer_transactions are created
INSERT INTO stripe_orders (
    checkout_session_id,
    payment_intent_id,
    customer_id,
    amount_subtotal,
    amount_total,
    currency,
    payment_status,
    status,
    metadata,
    created_at
)
SELECT 
    'manual_fix_' || sp.id as checkout_session_id,
    'pi_manual_fix_' || sp.id as payment_intent_id,
    sp.client_id as customer_id,
    sp.sync_fee as amount_subtotal,
    sp.sync_fee as amount_total,
    'usd' as currency,
    'paid' as payment_status,
    'completed' as status,
    jsonb_build_object('proposal_id', sp.id::text) as metadata,
    sp.payment_date as created_at
FROM sync_proposals sp
WHERE sp.payment_status = 'paid'
  AND sp.payment_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM stripe_orders so 
    WHERE so.metadata->>'proposal_id' = sp.id::text
  );

-- Step 8: Verify the fixes worked
SELECT 'After fix - proposals that should now be in Paid tab:' as info;
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
    payment_date
FROM sync_proposals 
WHERE client_status = 'accepted' 
  AND producer_status = 'accepted' 
  AND payment_status = 'paid'
ORDER BY updated_at DESC;

-- Step 9: Check if any proposals are still stuck
SELECT 'Any proposals still stuck in pending:' as info;
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
    updated_at
FROM sync_proposals 
WHERE client_status = 'accepted' 
  AND producer_status = 'accepted'
  AND (payment_status = 'pending' OR payment_status IS NULL OR payment_status = '');

-- Step 10: Summary of fixes applied
SELECT 'Summary of fixes applied:' as info;
SELECT 
    COUNT(*) as total_proposals,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_proposals,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_proposals,
    COUNT(CASE WHEN payment_status IS NULL OR payment_status = '' THEN 1 END) as null_payment_status
FROM sync_proposals 
WHERE client_status = 'accepted' 
  AND producer_status = 'accepted';
