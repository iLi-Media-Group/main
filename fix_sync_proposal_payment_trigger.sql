-- Fix Sync Proposal Payment Trigger
-- This script ensures the trigger properly updates payment status when payments are completed

-- Step 1: Drop and recreate the trigger function to ensure it works correctly
DROP TRIGGER IF EXISTS handle_sync_proposal_payment_trigger ON stripe_orders;
DROP FUNCTION IF EXISTS handle_sync_proposal_payment();

-- Step 2: Create the improved trigger function
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

-- Step 3: Create the trigger
CREATE TRIGGER handle_sync_proposal_payment_trigger
AFTER INSERT OR UPDATE ON stripe_orders
FOR EACH ROW
EXECUTE FUNCTION handle_sync_proposal_payment();

-- Step 4: Create a trigger to ensure payment_status is updated when both parties accept
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

-- Step 5: Create trigger for sync proposal acceptance
DROP TRIGGER IF EXISTS handle_sync_proposal_acceptance_trigger ON sync_proposals;
CREATE TRIGGER handle_sync_proposal_acceptance_trigger
BEFORE UPDATE ON sync_proposals
FOR EACH ROW
EXECUTE FUNCTION handle_sync_proposal_acceptance();

-- Step 6: Verify the triggers are created
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('handle_sync_proposal_payment_trigger', 'handle_sync_proposal_acceptance_trigger');

-- Step 7: Test the trigger by manually inserting a stripe_order for existing paid proposals
-- This will ensure the trigger fires and updates any proposals that should be marked as paid
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
    'trigger_test_' || sp.id as checkout_session_id,
    'pi_trigger_test_' || sp.id as payment_intent_id,
    sp.client_id as customer_id,
    sp.sync_fee as amount_subtotal,
    sp.sync_fee as amount_total,
    'usd' as currency,
    'paid' as payment_status,
    'completed' as status,
    jsonb_build_object('proposal_id', sp.id::text) as metadata,
    COALESCE(sp.payment_date, NOW()) as created_at
FROM sync_proposals sp
WHERE sp.client_status = 'accepted' 
  AND sp.producer_status = 'accepted'
  AND (sp.payment_status = 'pending' OR sp.payment_status IS NULL OR sp.payment_status = '')
  AND sp.sync_fee > 0
  AND NOT EXISTS (
    SELECT 1 FROM stripe_orders so 
    WHERE so.metadata->>'proposal_id' = sp.id::text
  );

-- Step 8: Verify the trigger worked
SELECT 'Proposals that should now be marked as paid:' as info;
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
