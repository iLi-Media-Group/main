-- Migration: Add term acceptance tracking and history for Sync Proposals
-- This implements Phase 1 of the enhanced negotiation system

-- 1. Add term acceptance tracking fields to sync_proposals
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS 
  client_terms_accepted jsonb DEFAULT '{}';

ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS 
  producer_terms_accepted jsonb DEFAULT '{}';

ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS 
  last_message_sender_id uuid REFERENCES profiles(id);

ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS 
  last_message_at timestamp with time zone;

-- 2. Create sync_proposal_history table for comprehensive message tracking
CREATE TABLE IF NOT EXISTS sync_proposal_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid REFERENCES sync_proposals(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id),
  sender_name text,
  message text NOT NULL,
  message_type text DEFAULT 'negotiation' CHECK (message_type IN ('negotiation', 'acceptance', 'decline', 'counter_offer', 'term_response')),
  term_changes jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Enable RLS on sync_proposal_history
ALTER TABLE sync_proposal_history ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for sync_proposal_history
-- Clients can view history for their own proposals
CREATE POLICY "Clients can view proposal history" 
ON sync_proposal_history 
FOR SELECT 
TO public 
USING (
  EXISTS (
    SELECT 1 FROM sync_proposals 
    WHERE sync_proposals.id = sync_proposal_history.proposal_id 
    AND sync_proposals.client_id = auth.uid()
  )
);

-- Producers can view history for proposals on their tracks
CREATE POLICY "Producers can view proposal history" 
ON sync_proposal_history 
FOR SELECT 
TO public 
USING (
  EXISTS (
    SELECT 1 FROM sync_proposals 
    JOIN tracks ON sync_proposals.track_id = tracks.id
    WHERE sync_proposals.id = sync_proposal_history.proposal_id 
    AND tracks.track_producer_id = auth.uid()
  )
);

-- Users can insert their own messages
CREATE POLICY "Users can insert proposal history" 
ON sync_proposal_history 
FOR INSERT 
TO public 
WITH CHECK (auth.uid() = sender_id);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_proposal_history_proposal_id 
ON sync_proposal_history(proposal_id);

CREATE INDEX IF NOT EXISTS idx_sync_proposal_history_created_at 
ON sync_proposal_history(created_at);

CREATE INDEX IF NOT EXISTS idx_sync_proposals_last_message_at 
ON sync_proposals(last_message_at);

-- 6. Create function to handle term acceptance/decline
CREATE OR REPLACE FUNCTION handle_term_response(
  p_proposal_id uuid,
  p_user_id uuid,
  p_user_type text, -- 'client' or 'producer'
  p_terms_response jsonb -- {amount: true/false, payment_terms: true/false, exclusivity: true/false}
)
RETURNS void AS $$
DECLARE
  v_sender_name text;
BEGIN
  -- Get sender name
  SELECT CONCAT(first_name, ' ', last_name) INTO v_sender_name
  FROM profiles WHERE id = p_user_id;
  
  -- Update terms acceptance
  IF p_user_type = 'client' THEN
    UPDATE sync_proposals 
    SET 
      client_terms_accepted = p_terms_response,
      last_message_sender_id = p_user_id,
      last_message_at = now()
    WHERE id = p_proposal_id;
  ELSE
    UPDATE sync_proposals 
    SET 
      producer_terms_accepted = p_terms_response,
      last_message_sender_id = p_user_id,
      last_message_at = now()
    WHERE id = p_proposal_id;
  END IF;
  
  -- Add to history
  INSERT INTO sync_proposal_history (
    proposal_id, sender_id, sender_name, message, message_type, term_changes
  ) VALUES (
    p_proposal_id, p_user_id, v_sender_name,
    'Terms response: ' || jsonb_pretty(p_terms_response),
    'term_response',
    p_terms_response
  );
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to update last message info when negotiation messages are added
CREATE OR REPLACE FUNCTION update_proposal_last_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last message info on sync_proposals only
  UPDATE sync_proposals 
  SET 
    last_message_sender_id = NEW.sender_id,
    last_message_at = NEW.created_at
  WHERE id = NEW.proposal_id;
  
  -- Don't duplicate messages in sync_proposal_history
  -- Messages should only be in proposal_negotiations table
  -- sync_proposal_history is for status changes and term responses only
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to automatically update last message info
DROP TRIGGER IF EXISTS update_proposal_last_message_trigger ON proposal_negotiations;
CREATE TRIGGER update_proposal_last_message_trigger
AFTER INSERT ON proposal_negotiations
FOR EACH ROW
EXECUTE FUNCTION update_proposal_last_message();

-- 9. Add comments for documentation
COMMENT ON TABLE sync_proposal_history IS 'Comprehensive history of all sync proposal interactions including negotiations, term responses, and status changes';
COMMENT ON COLUMN sync_proposals.client_terms_accepted IS 'JSON object tracking which terms the client has accepted: {amount: true/false, payment_terms: true/false, exclusivity: true/false}';
COMMENT ON COLUMN sync_proposals.producer_terms_accepted IS 'JSON object tracking which terms the producer has accepted: {amount: true/false, payment_terms: true/false, exclusivity: true/false}';
COMMENT ON COLUMN sync_proposals.last_message_sender_id IS 'ID of the user who sent the most recent message in this proposal';
COMMENT ON COLUMN sync_proposals.last_message_at IS 'Timestamp of the most recent message in this proposal'; 