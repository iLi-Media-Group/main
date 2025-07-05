-- Migration: Add negotiated_amount column to sync_proposals table
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS negotiated_amount numeric;

-- Add comment for documentation
COMMENT ON COLUMN sync_proposals.negotiated_amount IS 'Most recent negotiated amount for the sync proposal.'; 