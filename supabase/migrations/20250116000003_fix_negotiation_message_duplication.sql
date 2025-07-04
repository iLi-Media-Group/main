-- Migration: Fix negotiation message duplication in Proposal History
-- This fixes the issue where negotiation messages were being duplicated in sync_proposal_history

-- Update the trigger function to not duplicate messages
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

-- Clean up any duplicate messages that may have been created
-- Remove negotiation messages from sync_proposal_history that also exist in proposal_negotiations
DELETE FROM sync_proposal_history 
WHERE message_type = 'negotiation' 
AND EXISTS (
  SELECT 1 FROM proposal_negotiations 
  WHERE proposal_negotiations.proposal_id = sync_proposal_history.proposal_id
  AND proposal_negotiations.message = sync_proposal_history.message
  AND proposal_negotiations.created_at = sync_proposal_history.created_at
);

-- Add comment for documentation
COMMENT ON FUNCTION update_proposal_last_message() IS 'Updates last message info on sync_proposals without duplicating messages in sync_proposal_history'; 