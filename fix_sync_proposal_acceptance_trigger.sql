-- Fix Sync Proposal Acceptance Trigger
-- This script ensures payment_status is NEVER automatically set to 'paid'
-- Payment status should only be 'paid' when there's an actual Stripe payment

-- Step 1: Drop the problematic trigger that's setting payment_status = 'paid' incorrectly
DROP TRIGGER IF EXISTS handle_sync_proposal_acceptance_trigger ON sync_proposals;
DROP FUNCTION IF EXISTS handle_sync_proposal_acceptance();

-- Step 2: Create a corrected trigger function that NEVER sets payment_status = 'paid'
CREATE OR REPLACE FUNCTION handle_sync_proposal_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- If both parties have accepted, only set status and negotiation_status
  -- NEVER set payment_status = 'paid' - that should only happen after actual payment
  IF NEW.client_status = 'accepted' AND NEW.producer_status = 'accepted' THEN
    NEW.status := 'accepted';
    NEW.negotiation_status := 'accepted';
    -- payment_status should remain 'pending' until actual payment is made
    -- DO NOT set NEW.payment_status := 'paid' here
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create the corrected trigger
CREATE TRIGGER handle_sync_proposal_acceptance_trigger
BEFORE UPDATE ON sync_proposals
FOR EACH ROW
EXECUTE FUNCTION handle_sync_proposal_acceptance();

-- Step 4: Fix ALL proposals that were incorrectly marked as 'paid' without payment
UPDATE sync_proposals 
SET 
    payment_status = 'pending',
    payment_date = NULL,
    updated_at = NOW()
WHERE payment_status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM stripe_orders so 
    WHERE so.metadata->>'proposal_id' = sync_proposals.id::text
      AND so.payment_status = 'paid'
      AND so.status = 'completed'
  );

-- Step 5: Ensure only proposals with actual stripe_orders are marked as 'paid'
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

-- Step 6: Verify the correct state
SELECT 'Proposals that should be in Payment Pending (both parties accepted, no payment):' as info;
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

-- Step 7: Check for any proposals that are still incorrectly marked as 'paid'
SELECT 'Proposals incorrectly marked as paid (should be pending):' as info;
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
WHERE payment_status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM stripe_orders so 
    WHERE so.metadata->>'proposal_id' = sync_proposals.id::text
      AND so.payment_status = 'paid'
      AND so.status = 'completed'
  );

-- Step 8: Summary of the correct flow
SELECT 'Correct Sync Proposal Flow:' as info;
SELECT 
    '1. Client creates proposal' as step,
    '2. Producer accepts (stays in Pending)' as next_step,
    '3. Client accepts (moves to Payment Pending)' as next_step,
    '4. Client makes payment via Stripe' as next_step,
    '5. Stripe webhook updates payment_status = paid' as next_step,
    '6. Proposal moves to Paid tab' as final_step;
