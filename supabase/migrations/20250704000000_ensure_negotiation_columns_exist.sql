-- Ensure all negotiation-related columns exist in sync_proposals table
-- This migration adds any missing columns that are needed for negotiation functionality

-- Add final_amount column if it doesn't exist
ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS final_amount numeric(10,2);

-- Add negotiated_amount column if it doesn't exist
ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS negotiated_amount numeric(10,2);

-- Add final_payment_terms column if it doesn't exist
ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS final_payment_terms text CHECK (final_payment_terms IN ('immediate', 'net30', 'net60', 'net90'));

-- Add negotiated_payment_terms column if it doesn't exist
ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS negotiated_payment_terms text CHECK (negotiated_payment_terms IN ('immediate', 'net30', 'net60', 'net90'));

-- Add client_accepted_at column if it doesn't exist
ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS client_accepted_at timestamp with time zone;

-- Add negotiation_status column if it doesn't exist
ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS negotiation_status text DEFAULT 'open' CHECK (negotiation_status IN ('open', 'accepted', 'declined'));

-- Update existing records to have default values
UPDATE sync_proposals 
SET 
  final_amount = sync_fee,
  negotiated_amount = sync_fee,
  final_payment_terms = payment_terms,
  negotiated_payment_terms = payment_terms,
  negotiation_status = 'open'
WHERE final_amount IS NULL 
   OR negotiated_amount IS NULL 
   OR final_payment_terms IS NULL 
   OR negotiated_payment_terms IS NULL 
   OR negotiation_status IS NULL; 