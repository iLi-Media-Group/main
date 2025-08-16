-- Fix Sync Proposal Payment Flow
-- This script ensures the correct flow: Accepted -> Payment Pending -> Paid

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

-- Step 2: Fix the trigger function to NOT automatically set payment_status = 'paid'
-- When both parties accept, payment_status should remain 'pending' until payment is made
DROP TRIGGER IF EXISTS handle_sync_proposal_acceptance_trigger ON sync_proposals;
DROP FUNCTION IF EXISTS handle_sync_proposal_acceptance();

-- Step 3: Create the corrected trigger function
CREATE OR REPLACE FUNCTION handle_sync_proposal_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- If both parties have accepted, set status to 'accepted' but keep payment_status as 'pending'
  IF NEW.client_status = 'accepted' AND NEW.producer_status = 'accepted' THEN
    NEW.status := 'accepted';
    NEW.negotiation_status := 'accepted';
    -- DO NOT set payment_status = 'paid' here - it should remain 'pending' until payment
    -- NEW.payment_status := 'pending'; -- This is the default behavior
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger for sync proposal acceptance
CREATE TRIGGER handle_sync_proposal_acceptance_trigger
BEFORE UPDATE ON sync_proposals
FOR EACH ROW
EXECUTE FUNCTION handle_sync_proposal_acceptance();

-- Step 5: Fix any proposals that were incorrectly marked as 'paid' when they should be 'pending'
UPDATE sync_proposals 
SET 
    payment_status = 'pending',
    payment_date = NULL,
    updated_at = NOW()
WHERE client_status = 'accepted' 
  AND producer_status = 'accepted'
  AND payment_status = 'paid'
  AND sync_fee > 0;

-- Step 6: Ensure proposals that have actual payments remain 'paid'
-- Only proposals with stripe_orders should be marked as 'paid'
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
AND client_status = 'accepted' 
AND producer_status = 'accepted';

-- Step 7: Verify the correct flow
SELECT 'Proposals in Payment Pending (should be here after both parties accept):' as info;
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
  AND payment_status = 'pending'
ORDER BY updated_at DESC;

SELECT 'Proposals that are actually Paid (have stripe_orders):' as info;
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

-- Step 8: Summary of the correct flow
SELECT 'Summary of sync proposal flow:' as info;
SELECT 
    '1. Client creates proposal' as step,
    '2. Producer accepts' as next_step,
    '3. Client accepts' as next_step,
    '4. Proposal goes to "Payment Pending" tab' as next_step,
    '5. Client makes payment' as next_step,
    '6. Proposal moves to "Paid" tab' as final_step;

-- Step 9: Check if any proposals are in wrong states
SELECT 'Proposals that might be in wrong state:' as info;
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
WHERE (client_status = 'accepted' AND producer_status = 'accepted' AND payment_status = 'paid')
  AND NOT EXISTS (
    SELECT 1 FROM stripe_orders so 
    WHERE so.metadata->>'proposal_id' = sync_proposals.id::text
      AND so.payment_status = 'paid'
      AND so.status = 'completed'
  );
