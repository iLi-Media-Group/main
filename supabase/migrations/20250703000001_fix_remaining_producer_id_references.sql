-- Fix all remaining producer_id references to use correct column names

-- 1. Fix create_license_from_checkout function
CREATE OR REPLACE FUNCTION create_license_from_checkout()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_track_id uuid;
  v_producer_id uuid;
  v_profile_data json;
BEGIN
  -- Only process completed payments
  IF NEW.payment_status != 'paid' OR NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get the user_id for this customer
  SELECT user_id INTO v_user_id
  FROM stripe_customers
  WHERE customer_id = NEW.customer_id;

  -- Check if we have track_id in metadata (for single track purchases)
  IF NEW.metadata IS NOT NULL AND NEW.metadata->>'track_id' IS NOT NULL THEN
    -- Get track_id and producer_id
    v_track_id := (NEW.metadata->>'track_id')::uuid;
    
    -- Get producer_id for this track (use correct column name)
    SELECT track_producer_id INTO v_producer_id
    FROM tracks
    WHERE id = v_track_id;
    
    -- Get user profile data for licensee info
    SELECT 
      json_build_object(
        'name', COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''),
        'email', email
      ) INTO v_profile_data
    FROM profiles
    WHERE id = v_user_id;
    
    -- Create license record if it doesn't already exist (use correct column name)
    INSERT INTO sales (
      track_id,
      sale_producer_id,
      buyer_id,
      license_type,
      amount,
      payment_method,
      transaction_id,
      licensee_info
    )
    SELECT
      v_track_id,
      v_producer_id,
      v_user_id,
      'Single Track',
      NEW.amount_total / 100, -- Convert from cents to dollars
      'stripe',
      NEW.payment_intent_id,
      v_profile_data
    WHERE NOT EXISTS (
      -- Check if this transaction already has a license record
      SELECT 1 FROM sales 
      WHERE transaction_id = NEW.payment_intent_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Fix any remaining functions that reference tracks.producer_id
-- Update the media types policy to use correct column name
DROP POLICY IF EXISTS "Users can view media types for their own tracks" ON track_media_types;
CREATE POLICY "Users can view media types for their own tracks" ON track_media_types
FOR SELECT USING (
  auth.uid() = (SELECT track_producer_id FROM tracks WHERE id = track_media_types.track_id)
);

-- 3. Fix any functions that might be using the old column names
-- This will catch any other functions that might have been missed
DO $$
DECLARE
  func_record RECORD;
  func_body TEXT;
  new_body TEXT;
BEGIN
  -- Loop through all functions and update any that reference the old column names
  FOR func_record IN 
    SELECT 
      p.proname as func_name,
      pg_get_functiondef(p.oid) as func_definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND pg_get_functiondef(p.oid) LIKE '%producer_id%'
  LOOP
    func_body := func_record.func_definition;
    
    -- Replace old column references with new ones
    new_body := func_body;
    new_body := REPLACE(new_body, 'tracks.producer_id', 'tracks.track_producer_id');
    new_body := REPLACE(new_body, 'producer_balances.producer_id', 'producer_balances.balance_producer_id');
    new_body := REPLACE(new_body, 'producer_transactions.producer_id', 'producer_transactions.transaction_producer_id');
    new_body := REPLACE(new_body, 'producer_payment_methods.producer_id', 'producer_payment_methods.payment_method_producer_id');
    new_body := REPLACE(new_body, 'producer_withdrawals.producer_id', 'producer_withdrawals.withdrawal_producer_id');
    new_body := REPLACE(new_body, 'sync_proposals.producer_id', 'sync_proposals.proposal_producer_id');
    
    -- Only update if changes were made
    IF new_body != func_body THEN
      EXECUTE new_body;
    END IF;
  END LOOP;
END $$; 