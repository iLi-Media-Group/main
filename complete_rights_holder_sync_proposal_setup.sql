-- Complete Rights Holder Sync Proposal Setup
-- This script ensures all necessary database functions, policies, and columns are in place
-- for the complete rights holder sync proposal negotiation functionality

-- 1. Ensure all necessary columns exist in sync_proposals table
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_proposals' AND column_name = 'negotiated_amount') THEN
        ALTER TABLE sync_proposals ADD COLUMN negotiated_amount DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_proposals' AND column_name = 'negotiated_payment_terms') THEN
        ALTER TABLE sync_proposals ADD COLUMN negotiated_payment_terms TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_proposals' AND column_name = 'negotiated_additional_terms') THEN
        ALTER TABLE sync_proposals ADD COLUMN negotiated_additional_terms TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_proposals' AND column_name = 'client_accepted_at') THEN
        ALTER TABLE sync_proposals ADD COLUMN client_accepted_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_proposals' AND column_name = 'payment_due_date') THEN
        ALTER TABLE sync_proposals ADD COLUMN payment_due_date TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_proposals' AND column_name = 'final_amount') THEN
        ALTER TABLE sync_proposals ADD COLUMN final_amount DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_proposals' AND column_name = 'final_payment_terms') THEN
        ALTER TABLE sync_proposals ADD COLUMN final_payment_terms TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_proposals' AND column_name = 'payment_status') THEN
        ALTER TABLE sync_proposals ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- 2. Create or replace the handle_negotiation_acceptance function
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
        -- Both parties have accepted - set final acceptance and trigger payment
        UPDATE sync_proposals 
        SET 
          status = 'accepted',
          negotiation_status = 'accepted',
          payment_due_date = calculate_payment_due_date(acceptance_date, COALESCE(proposal_record.negotiated_payment_terms, proposal_record.payment_terms)),
          updated_at = acceptance_date
        WHERE id = proposal_id;
      ELSE
        -- Producer hasn't accepted yet - set status to pending producer acceptance
        UPDATE sync_proposals 
        SET 
          status = 'pending_producer',
          negotiation_status = 'negotiating',
          updated_at = acceptance_date
        WHERE id = proposal_id;
      END IF;
      
    ELSE
      -- Producer/Rights Holder is accepting - update producer status
      UPDATE sync_proposals 
      SET 
        producer_status = 'accepted',
        updated_at = acceptance_date
      WHERE id = proposal_id;
      
      -- Check if client has already accepted
      IF proposal_record.client_status = 'accepted' THEN
        -- Both parties have accepted - set final acceptance and trigger payment
        UPDATE sync_proposals 
        SET 
          status = 'accepted',
          negotiation_status = 'accepted',
          payment_due_date = calculate_payment_due_date(acceptance_date, COALESCE(proposal_record.negotiated_payment_terms, proposal_record.payment_terms)),
          updated_at = acceptance_date
        WHERE id = proposal_id;
      ELSE
        -- Client hasn't accepted yet - set status to pending client acceptance
        UPDATE sync_proposals 
        SET 
          status = 'pending_client',
          negotiation_status = 'client_acceptance_required',
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

-- 3. Create or replace the handle_negotiation_rejection function
CREATE OR REPLACE FUNCTION handle_negotiation_rejection(
  proposal_id uuid,
  is_sync_proposal boolean DEFAULT true
) RETURNS void AS $$
DECLARE
  rejection_date timestamptz := NOW();
  proposal_record record;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF is_sync_proposal THEN
    -- Get proposal details
    SELECT * INTO proposal_record FROM sync_proposals WHERE id = proposal_id;
    
    -- Update proposal status to rejected
    UPDATE sync_proposals 
    SET 
      status = 'rejected',
      negotiation_status = 'rejected',
      updated_at = rejection_date
    WHERE id = proposal_id;
    
    -- Update specific party status based on who is rejecting
    IF current_user_id = proposal_record.client_id THEN
      UPDATE sync_proposals 
      SET client_status = 'rejected'
      WHERE id = proposal_id;
    ELSE
      UPDATE sync_proposals 
      SET producer_status = 'rejected'
      WHERE id = proposal_id;
    END IF;
    
  ELSE
    -- Handle custom sync requests
    UPDATE custom_sync_requests 
    SET 
      negotiation_status = 'rejected',
      updated_at = rejection_date
    WHERE id = proposal_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Create or replace the calculate_payment_due_date function
CREATE OR REPLACE FUNCTION calculate_payment_due_date(
  acceptance_date timestamptz,
  payment_terms text
) RETURNS timestamptz AS $$
BEGIN
  CASE payment_terms
    WHEN 'immediate' THEN
      RETURN acceptance_date;
    WHEN 'net30' THEN
      RETURN acceptance_date + INTERVAL '30 days';
    WHEN 'net60' THEN
      RETURN acceptance_date + INTERVAL '60 days';
    WHEN 'net90' THEN
      RETURN acceptance_date + INTERVAL '90 days';
    ELSE
      RETURN acceptance_date;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 5. Ensure proposal_negotiations table exists with all necessary columns
CREATE TABLE IF NOT EXISTS proposal_negotiations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid NOT NULL REFERENCES sync_proposals(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id),
  message text NOT NULL,
  counter_offer decimal(10,2),
  counter_terms text,
  counter_payment_terms text,
  is_system_message boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 6. Ensure proposal_history table exists
CREATE TABLE IF NOT EXISTS proposal_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid NOT NULL REFERENCES sync_proposals(id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- 7. Enable RLS on all tables
ALTER TABLE sync_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_history ENABLE ROW LEVEL SECURITY;

-- 8. Create comprehensive RLS policies for sync_proposals
DROP POLICY IF EXISTS "Users can view own sync proposals" ON sync_proposals;
DROP POLICY IF EXISTS "Users can update own sync proposals" ON sync_proposals;
DROP POLICY IF EXISTS "Users can insert sync proposals" ON sync_proposals;

-- Policy for viewing sync proposals
CREATE POLICY "Users can view own sync proposals" ON sync_proposals
  FOR SELECT USING (
    auth.uid() = client_id OR 
    auth.uid() = (SELECT track_producer_id FROM tracks WHERE id = track_id)
  );

-- Policy for updating sync proposals
CREATE POLICY "Users can update own sync proposals" ON sync_proposals
  FOR UPDATE USING (
    auth.uid() = client_id OR 
    auth.uid() = (SELECT track_producer_id FROM tracks WHERE id = track_id)
  );

-- Policy for inserting sync proposals
CREATE POLICY "Users can insert sync proposals" ON sync_proposals
  FOR INSERT WITH CHECK (
    auth.uid() = client_id
  );

-- 9. Create RLS policies for proposal_negotiations
DROP POLICY IF EXISTS "Users can view proposal negotiations" ON proposal_negotiations;
DROP POLICY IF EXISTS "Users can insert proposal negotiations" ON proposal_negotiations;

CREATE POLICY "Users can view proposal negotiations" ON proposal_negotiations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT client_id FROM sync_proposals WHERE id = proposal_id
      UNION
      SELECT track_producer_id FROM tracks WHERE id = (SELECT track_id FROM sync_proposals WHERE id = proposal_id)
    )
  );

CREATE POLICY "Users can insert proposal negotiations" ON proposal_negotiations
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
      SELECT client_id FROM sync_proposals WHERE id = proposal_id
      UNION
      SELECT track_producer_id FROM tracks WHERE id = (SELECT track_id FROM sync_proposals WHERE id = proposal_id)
    )
  );

-- 10. Create RLS policies for proposal_history
DROP POLICY IF EXISTS "Users can view proposal history" ON proposal_history;
DROP POLICY IF EXISTS "Users can insert proposal history" ON proposal_history;

CREATE POLICY "Users can view proposal history" ON proposal_history
  FOR SELECT USING (
    auth.uid() IN (
      SELECT client_id FROM sync_proposals WHERE id = proposal_id
      UNION
      SELECT track_producer_id FROM tracks WHERE id = (SELECT track_id FROM sync_proposals WHERE id = proposal_id)
    )
  );

CREATE POLICY "Users can insert proposal history" ON proposal_history
  FOR INSERT WITH CHECK (
    auth.uid() = changed_by AND
    auth.uid() IN (
      SELECT client_id FROM sync_proposals WHERE id = proposal_id
      UNION
      SELECT track_producer_id FROM tracks WHERE id = (SELECT track_id FROM sync_proposals WHERE id = proposal_id)
    )
  );

-- 11. Grant necessary permissions
GRANT ALL ON sync_proposals TO authenticated;
GRANT ALL ON proposal_negotiations TO authenticated;
GRANT ALL ON proposal_history TO authenticated;
GRANT EXECUTE ON FUNCTION handle_negotiation_acceptance(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_negotiation_rejection(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_payment_due_date(timestamptz, text) TO authenticated;

-- 12. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sync_proposals_client_id ON sync_proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_sync_proposals_track_id ON sync_proposals(track_id);
CREATE INDEX IF NOT EXISTS idx_sync_proposals_status ON sync_proposals(status);
CREATE INDEX IF NOT EXISTS idx_sync_proposals_negotiation_status ON sync_proposals(negotiation_status);
CREATE INDEX IF NOT EXISTS idx_proposal_negotiations_proposal_id ON proposal_negotiations(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_negotiations_sender_id ON proposal_negotiations(sender_id);
CREATE INDEX IF NOT EXISTS idx_proposal_history_proposal_id ON proposal_history(proposal_id);

-- 13. Verify the setup
SELECT 'Rights Holder Sync Proposal Setup Complete!' as status;
SELECT 'sync_proposals columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sync_proposals' 
ORDER BY ordinal_position;
