-- Migration: Add client_accepted_at column to sync_proposals table
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS client_accepted_at timestamptz;

-- Add comment for documentation
COMMENT ON COLUMN sync_proposals.client_accepted_at IS 'Timestamp when the client accepted the negotiation.'; 