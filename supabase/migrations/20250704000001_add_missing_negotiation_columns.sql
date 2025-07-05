-- Add missing negotiation columns to sync_proposals table
-- This is a simplified version to fix the immediate error

-- Add final_amount column if it doesn't exist
ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS final_amount numeric(10,2);

-- Add negotiated_amount column if it doesn't exist
ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS negotiated_amount numeric(10,2);

-- Add client_accepted_at column if it doesn't exist
ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS client_accepted_at timestamp with time zone;

-- Add negotiation_status column if it doesn't exist
ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS negotiation_status text DEFAULT 'open';

-- Update existing records to have default values
UPDATE sync_proposals 
SET 
  final_amount = sync_fee,
  negotiated_amount = sync_fee,
  negotiation_status = 'open'
WHERE final_amount IS NULL 
   OR negotiated_amount IS NULL 
   OR negotiation_status IS NULL; 