-- Migration: Add final_amount column to sync_proposals table
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS final_amount numeric;

-- Add comment for documentation
COMMENT ON COLUMN sync_proposals.final_amount IS 'Final agreed amount for the sync proposal.'; 