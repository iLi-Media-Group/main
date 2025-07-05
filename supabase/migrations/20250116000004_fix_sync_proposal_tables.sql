-- Migration: Fix sync proposal system - preserve existing tables and add missing features
-- This fixes issues while preserving existing proposal_negotiations and proposal_files tables

-- 1. Ensure sync_proposals has all required columns (don't recreate existing tables)
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS client_status text DEFAULT 'pending';
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS producer_status text DEFAULT 'pending';
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS invoice_id text;
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS payment_date timestamptz;
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS final_amount integer;
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS payment_due_date timestamptz;
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS stripe_invoice_id text;
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS negotiation_status text DEFAULT 'pending';
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS client_terms_accepted jsonb DEFAULT '{}';
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS producer_terms_accepted jsonb DEFAULT '{}';
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS last_message_sender_id uuid REFERENCES profiles(id);
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS last_message_at timestamptz;

-- 2. Update status constraints to allow all valid statuses
ALTER TABLE sync_proposals DROP CONSTRAINT IF EXISTS sync_proposals_status_check;
ALTER TABLE sync_proposals ADD CONSTRAINT sync_proposals_status_check
  CHECK (status IN (
    'pending',
    'pending_client',
    'pending_producer',
    'client_accepted',
    'producer_accepted',
    'accepted',
    'rejected',
    'expired'
  ));

-- 3. Add constraints for client_status and producer_status
ALTER TABLE sync_proposals DROP CONSTRAINT IF EXISTS sync_proposals_client_status_check;
ALTER TABLE sync_proposals ADD CONSTRAINT sync_proposals_client_status_check
  CHECK (client_status IN ('pending', 'accepted', 'rejected'));

ALTER TABLE sync_proposals DROP CONSTRAINT IF EXISTS sync_proposals_producer_status_check;
ALTER TABLE sync_proposals ADD CONSTRAINT sync_proposals_producer_status_check
  CHECK (producer_status IN ('pending', 'accepted', 'rejected'));

-- 4. Add constraint for payment_status
ALTER TABLE sync_proposals DROP CONSTRAINT IF EXISTS sync_proposals_payment_status_check;
ALTER TABLE sync_proposals ADD CONSTRAINT sync_proposals_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'failed'));

-- 5. Add constraint for negotiation_status
ALTER TABLE sync_proposals DROP CONSTRAINT IF EXISTS sync_proposals_negotiation_status_check;
ALTER TABLE sync_proposals ADD CONSTRAINT sync_proposals_negotiation_status_check
  CHECK (negotiation_status IN ('pending', 'negotiating', 'completed'));

-- 6. Ensure proposal_history table exists (create if not exists)
CREATE TABLE IF NOT EXISTS proposal_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES sync_proposals(id) ON DELETE CASCADE NOT NULL,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES profiles(id) NOT NULL,
  changed_at timestamptz DEFAULT now()
);

-- 7. Enable RLS on proposal_history (if not already enabled)
ALTER TABLE proposal_history ENABLE ROW LEVEL SECURITY;

-- 8. Create/Update RLS policies for proposal_history
DROP POLICY IF EXISTS "Users can view history for their proposals" ON proposal_history;
CREATE POLICY "Users can view history for their proposals"
  ON proposal_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sync_proposals sp
      WHERE sp.id = proposal_id
      AND (
        sp.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM tracks t
          WHERE t.id = sp.track_id
          AND t.track_producer_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can create history for their proposals" ON proposal_history;
CREATE POLICY "Users can create history for their proposals"
  ON proposal_history
  FOR INSERT
  WITH CHECK (
    auth.uid() = changed_by
    AND EXISTS (
      SELECT 1 FROM sync_proposals sp
      WHERE sp.id = proposal_id
      AND (
        sp.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM tracks t
          WHERE t.id = sp.track_id
          AND t.track_producer_id = auth.uid()
        )
      )
    )
  );

-- 9. Update RLS policies for existing proposal_negotiations table
DROP POLICY IF EXISTS "Users can view negotiations for their proposals" ON proposal_negotiations;
CREATE POLICY "Users can view negotiations for their proposals"
  ON proposal_negotiations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sync_proposals sp
      WHERE sp.id = proposal_id
      AND (
        sp.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM tracks t
          WHERE t.id = sp.track_id
          AND t.track_producer_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert negotiations for their proposals" ON proposal_negotiations;
CREATE POLICY "Users can insert negotiations for their proposals"
  ON proposal_negotiations
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM sync_proposals sp
      WHERE sp.id = proposal_id
      AND (
        sp.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM tracks t
          WHERE t.id = sp.track_id
          AND t.track_producer_id = auth.uid()
        )
      )
    )
  );

-- 10. Update RLS policies for existing proposal_files table
DROP POLICY IF EXISTS "Users can view files for their proposals" ON proposal_files;
CREATE POLICY "Users can view files for their proposals"
  ON proposal_files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sync_proposals sp
      WHERE sp.id = proposal_id
      AND (
        sp.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM tracks t
          WHERE t.id = sp.track_id
          AND t.track_producer_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can upload files for their proposals" ON proposal_files;
CREATE POLICY "Users can upload files for their proposals"
  ON proposal_files
  FOR INSERT
  WITH CHECK (
    auth.uid() = uploader_id
    AND EXISTS (
      SELECT 1 FROM sync_proposals sp
      WHERE sp.id = proposal_id
      AND (
        sp.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM tracks t
          WHERE t.id = sp.track_id
          AND t.track_producer_id = auth.uid()
        )
      )
    )
  );

-- 11. Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_proposal_negotiations_proposal_id ON proposal_negotiations(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_negotiations_created_at ON proposal_negotiations(created_at);
CREATE INDEX IF NOT EXISTS idx_proposal_files_proposal_id ON proposal_files(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_files_created_at ON proposal_files(created_at);
CREATE INDEX IF NOT EXISTS idx_proposal_history_proposal_id ON proposal_history(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_history_changed_at ON proposal_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_sync_proposals_last_message_at ON sync_proposals(last_message_at);

-- 12. Create trigger function to update last message info
CREATE OR REPLACE FUNCTION update_proposal_last_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last message info on sync_proposals
  UPDATE sync_proposals 
  SET 
    last_message_sender_id = NEW.sender_id,
    last_message_at = NEW.created_at
  WHERE id = NEW.proposal_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Create trigger to automatically update last message info
DROP TRIGGER IF EXISTS update_proposal_last_message_trigger ON proposal_negotiations;
CREATE TRIGGER update_proposal_last_message_trigger
AFTER INSERT ON proposal_negotiations
FOR EACH ROW
EXECUTE FUNCTION update_proposal_last_message();

-- 14. Create trigger function to track proposal history
CREATE OR REPLACE FUNCTION track_proposal_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO proposal_history (
      proposal_id,
      previous_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Create trigger to track status changes
DROP TRIGGER IF EXISTS track_proposal_status_changes ON sync_proposals;
CREATE TRIGGER track_proposal_status_changes
  BEFORE UPDATE ON sync_proposals
  FOR EACH ROW
  EXECUTE FUNCTION track_proposal_history();

-- 16. Add comments for documentation
COMMENT ON TABLE proposal_negotiations IS 'Stores negotiation messages between clients and producers for sync proposals';
COMMENT ON TABLE proposal_files IS 'Stores files shared between clients and producers for sync proposals';
COMMENT ON TABLE proposal_history IS 'Tracks status changes and history for sync proposals';
COMMENT ON TABLE sync_proposals IS 'Main table for sync licensing proposals between clients and producers'; 