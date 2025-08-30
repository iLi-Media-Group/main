-- COMPREHENSIVE FIX: Sync Proposal Payment Flow
-- This script fixes ALL potential sources of the payment_status issue
-- Ensures payment_status is ONLY set to 'paid' when there's an actual Stripe payment

-- Step 1: Drop ALL existing triggers and functions that might be causing the issue
DROP TRIGGER IF EXISTS handle_sync_proposal_acceptance_trigger ON sync_proposals;
DROP TRIGGER IF EXISTS handle_sync_proposal_payment_trigger ON stripe_orders;
DROP FUNCTION IF EXISTS handle_sync_proposal_acceptance();
DROP FUNCTION IF EXISTS handle_sync_proposal_payment();

-- Step 2: Fix the handle_negotiation_acceptance function to NEVER set payment_status = 'paid'
CREATE OR REPLACE FUNCTION handle_negotiation_acceptance(
  proposal_id uuid,
  is_sync_proposal boolean DEFAULT true
) RETURNS void AS $$
DECLARE
  acceptance_date timestamptz := NOW();
  proposal_record record;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF is_sync_proposal THEN
    -- Get proposal details
    SELECT * INTO proposal_record FROM sync_proposals WHERE id = proposal_id;
    
    -- Check if current user is the client
    IF current_user_id = proposal_record.client_id THEN
      -- Client is accepting - update client status
      UPDATE sync_proposals 
      SET 
        client_status = 'accepted',
        client_accepted_at = acceptance_date,
        final_amount = COALESCE(proposal_record.negotiated_amount, proposal_record.sync_fee),
        final_payment_terms = COALESCE(proposal_record.negotiated_payment_terms, proposal_record.payment_terms),
        updated_at = acceptance_date
      WHERE id = proposal_id;
      
      -- Check if producer has already accepted
      IF proposal_record.producer_status = 'accepted' THEN
        -- Both parties have accepted - set final acceptance, move to payment pending
        -- NEVER set payment_status = 'paid' here - it should remain 'pending' until payment
        UPDATE sync_proposals 
        SET 
          status = 'accepted',
          negotiation_status = 'accepted',
          payment_due_date = calculate_payment_due_date(acceptance_date, COALESCE(proposal_record.negotiated_payment_terms, proposal_record.payment_terms)),
          payment_status = 'pending', -- Explicitly set to pending, not paid
          updated_at = acceptance_date
        WHERE id = proposal_id;
      ELSE
        -- Producer hasn't accepted yet - set status to pending producer acceptance
        UPDATE sync_proposals 
        SET 
          status = 'pending_producer',
          negotiation_status = 'client_accepted',
          updated_at = acceptance_date
        WHERE id = proposal_id;
      END IF;
      
    ELSE
      -- Producer is accepting - update producer status
      UPDATE sync_proposals 
      SET 
        producer_status = 'accepted',
        updated_at = acceptance_date
      WHERE id = proposal_id;
      
      -- Check if client has already accepted
      IF proposal_record.client_status = 'accepted' THEN
        -- Both parties have accepted - set final acceptance, move to payment pending
        -- NEVER set payment_status = 'paid' here - it should remain 'pending' until payment
        UPDATE sync_proposals 
        SET 
          status = 'accepted',
          negotiation_status = 'accepted',
          payment_due_date = calculate_payment_due_date(acceptance_date, COALESCE(proposal_record.negotiated_payment_terms, proposal_record.payment_terms)),
          payment_status = 'pending', -- Explicitly set to pending, not paid
          updated_at = acceptance_date
        WHERE id = proposal_id;
      ELSE
        -- Client hasn't accepted yet - set status to pending client acceptance
        UPDATE sync_proposals 
        SET 
          status = 'pending_client',
          negotiation_status = 'producer_accepted',
          updated_at = acceptance_date
        WHERE id = proposal_id;
      END IF;
    END IF;
    
  ELSE
    -- Handle custom sync requests (simplified for now)
    UPDATE custom_sync_requests 
    SET 
      negotiation_status = 'accepted',
      client_accepted_at = acceptance_date,
      final_amount = COALESCE(negotiated_amount, sync_fee),
      final_payment_terms = COALESCE(negotiated_payment_terms, payment_terms),
      payment_due_date = calculate_payment_due_date(acceptance_date, COALESCE(negotiated_payment_terms, payment_terms)),
      updated_at = acceptance_date
    WHERE id = proposal_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create the CORRECTED acceptance trigger that NEVER sets payment_status = 'paid'
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

-- Step 4: Create the acceptance trigger
CREATE TRIGGER handle_sync_proposal_acceptance_trigger
BEFORE UPDATE ON sync_proposals
FOR EACH ROW
EXECUTE FUNCTION handle_sync_proposal_acceptance();

-- Step 5: Create the CORRECTED payment trigger that only sets payment_status = 'paid' after actual payment
CREATE OR REPLACE FUNCTION handle_sync_proposal_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_proposal_id uuid;
  v_producer_id uuid;
  v_client_id uuid;
  v_track_id uuid;
  v_sync_fee numeric;
  v_compensation_settings record;
  v_producer_rate numeric;
  v_producer_amount numeric;
BEGIN
  -- Only process completed payments with proposal_id in metadata
  IF NEW.payment_status != 'paid' OR NEW.status != 'completed' OR 
     NEW.metadata IS NULL OR NEW.metadata->>'proposal_id' IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get proposal ID from metadata
  v_proposal_id := (NEW.metadata->>'proposal_id')::uuid;
  
  -- Get proposal details
  SELECT 
    sync_proposals.track_id, 
    sync_proposals.client_id, 
    sync_proposals.sync_fee,
    tracks.producer_id
  INTO 
    v_track_id, 
    v_client_id, 
    v_sync_fee,
    v_producer_id
  FROM 
    sync_proposals
  JOIN
    tracks ON sync_proposals.track_id = tracks.id
  WHERE 
    sync_proposals.id = v_proposal_id;
  
  -- Update proposal payment status ONLY when there's an actual payment
  UPDATE sync_proposals
  SET 
    payment_status = 'paid',
    payment_date = NOW(),
    invoice_id = NEW.payment_intent_id,
    updated_at = NOW()
  WHERE 
    id = v_proposal_id;
  
  -- Also ensure status and negotiation_status are set correctly
  UPDATE sync_proposals
  SET 
    status = 'accepted',
    negotiation_status = 'accepted',
    updated_at = NOW()
  WHERE 
    id = v_proposal_id
    AND client_status = 'accepted' 
    AND producer_status = 'accepted';
  
  -- Get compensation settings
  SELECT * INTO v_compensation_settings FROM compensation_settings LIMIT 1;
  
  -- Default settings if none exist
  IF v_compensation_settings IS NULL THEN
    v_compensation_settings := ROW(1, 70, 80, 85, 30, 50, 2, now(), now(), 2, 5, 3)::compensation_settings;
  END IF;
  
  -- Use sync fee rate for producer compensation
  v_producer_rate := v_compensation_settings.sync_fee_rate / 100.0;
  
  -- Calculate producer amount
  v_producer_amount := v_sync_fee * v_producer_rate;
  
  -- Update producer balance
  INSERT INTO producer_balances (
    producer_id, 
    pending_balance, 
    available_balance, 
    lifetime_earnings
  )
  VALUES (
    v_producer_id, 
    v_producer_amount, 
    0, 
    v_producer_amount
  )
  ON CONFLICT (producer_id) DO UPDATE
  SET 
    pending_balance = producer_balances.pending_balance + v_producer_amount,
    lifetime_earnings = producer_balances.lifetime_earnings + v_producer_amount;
  
  -- Create transaction record
  INSERT INTO producer_transactions (
    producer_id,
    amount,
    type,
    status,
    description,
    track_title,
    reference_id
  )
  SELECT
    v_producer_id,
    v_producer_amount,
    'sale',
    'pending',
    'Sync Fee: ' || t.title,
    t.title,
    v_proposal_id::text
  FROM tracks t
  WHERE t.id = v_track_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create the payment trigger
CREATE TRIGGER handle_sync_proposal_payment_trigger
AFTER INSERT OR UPDATE ON stripe_orders
FOR EACH ROW
EXECUTE FUNCTION handle_sync_proposal_payment();

-- Step 7: CRITICAL: Fix ALL proposals that were incorrectly marked as 'paid' without payment
-- This reverts any proposals that don't have a corresponding stripe_orders record
UPDATE sync_proposals 
SET 
    payment_status = 'pending',
    payment_date = NULL,
    invoice_id = NULL,
    updated_at = NOW()
WHERE payment_status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM stripe_orders so 
    WHERE so.metadata->>'proposal_id' = sync_proposals.id::text
      AND so.payment_status = 'paid'
      AND so.status = 'completed'
  );

-- Step 8: Ensure only proposals with actual stripe_orders are marked as 'paid'
UPDATE sync_proposals 
SET 
    payment_status = 'paid',
    payment_date = NOW(),
    invoice_id = so.payment_intent_id,
    updated_at = NOW()
FROM stripe_orders so
WHERE so.metadata->>'proposal_id' = sync_proposals.id::text
  AND so.payment_status = 'paid'
  AND so.status = 'completed'
  AND sync_proposals.payment_status != 'paid';

-- Step 9: Add a constraint to prevent payment_status = 'paid' without invoice_id
-- This is a safety measure to prevent future issues
ALTER TABLE sync_proposals 
ADD CONSTRAINT check_payment_status_with_invoice 
CHECK (
  (payment_status = 'paid' AND invoice_id IS NOT NULL) OR 
  (payment_status != 'paid')
);

-- Step 10: Verify the current state
SELECT 'Current state after comprehensive fix:' as info;
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

-- Step 11: Show proposals that should be in "Paid" tab (have actual payments)
SELECT 'Proposals with actual payments (should be in Paid tab):' as info;
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
WHERE payment_status = 'paid'
  AND invoice_id IS NOT NULL
ORDER BY updated_at DESC;

-- Step 12: Show proposals that should be in "Payment Pending" tab (accepted but not paid)
SELECT 'Proposals accepted but not paid (should be in Payment Pending tab):' as info;
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
  AND payment_status = 'pending'
ORDER BY updated_at DESC;

-- Step 13: Verify triggers are created correctly
SELECT 'Verifying triggers:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('handle_sync_proposal_payment_trigger', 'handle_sync_proposal_acceptance_trigger');

-- Step 14: Show any proposals that might still be incorrectly marked as 'paid'
SELECT 'WARNING: Proposals marked as paid without invoice_id (should be fixed):' as info;
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
WHERE payment_status = 'paid'
  AND invoice_id IS NULL
ORDER BY updated_at DESC;
