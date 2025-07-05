-- Migration: Fix negotiation_status column and constraint
-- This ensures the negotiation_status column exists with the correct check constraint

-- First, ensure the column exists
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS negotiation_status text DEFAULT 'pending';

-- Drop the existing constraint if it exists
ALTER TABLE sync_proposals DROP CONSTRAINT IF EXISTS sync_proposals_negotiation_status_check;

-- Add the correct constraint
ALTER TABLE sync_proposals ADD CONSTRAINT sync_proposals_negotiation_status_check 
CHECK (negotiation_status IN ('pending', 'negotiating', 'client_acceptance_required', 'accepted', 'rejected'));

-- Add comment for documentation
COMMENT ON COLUMN sync_proposals.negotiation_status IS 'Status of negotiation: pending, negotiating, client_acceptance_required, accepted, rejected'; 