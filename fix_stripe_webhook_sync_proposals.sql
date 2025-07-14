-- Fix Stripe webhook handling for sync proposals
-- This ensures that when a payment is completed, the sync proposal payment_status is properly updated

-- First, let's check if the stripe_orders table has the correct trigger
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'handle_sync_proposal_payment_trigger';

-- Create or replace the function to handle sync proposal payments
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
  
  -- Update proposal payment status
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

-- Create trigger to handle sync proposal payments
DROP TRIGGER IF EXISTS handle_sync_proposal_payment_trigger ON stripe_orders;
CREATE TRIGGER handle_sync_proposal_payment_trigger
AFTER INSERT OR UPDATE ON stripe_orders
FOR EACH ROW
EXECUTE FUNCTION handle_sync_proposal_payment();

-- Also create a trigger to ensure payment_status is updated when both parties accept
CREATE OR REPLACE FUNCTION handle_sync_proposal_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- If both parties have accepted, ensure payment_status is set to 'paid'
  IF NEW.client_status = 'accepted' AND NEW.producer_status = 'accepted' THEN
    NEW.payment_status := 'paid';
    NEW.payment_date := NOW();
    NEW.status := 'accepted';
    NEW.negotiation_status := 'accepted';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sync proposal acceptance
DROP TRIGGER IF EXISTS handle_sync_proposal_acceptance_trigger ON sync_proposals;
CREATE TRIGGER handle_sync_proposal_acceptance_trigger
BEFORE UPDATE ON sync_proposals
FOR EACH ROW
EXECUTE FUNCTION handle_sync_proposal_acceptance();

-- Verify the triggers are created
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('handle_sync_proposal_payment_trigger', 'handle_sync_proposal_acceptance_trigger'); 