-- Comprehensive fix for all missing columns in sync_proposals table
-- Run this in your Supabase dashboard SQL editor

-- Add all missing negotiation columns
ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS final_amount numeric(10,2),
ADD COLUMN IF NOT EXISTS negotiated_amount numeric(10,2),
ADD COLUMN IF NOT EXISTS final_payment_terms text CHECK (final_payment_terms IN ('immediate', 'net30', 'net60', 'net90')),
ADD COLUMN IF NOT EXISTS negotiated_payment_terms text CHECK (negotiated_payment_terms IN ('immediate', 'net30', 'net60', 'net90')),
ADD COLUMN IF NOT EXISTS client_accepted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS negotiation_status text DEFAULT 'pending' CHECK (negotiation_status IN ('pending', 'negotiating', 'client_acceptance_required', 'accepted', 'rejected'));

-- Update existing records with default values
UPDATE sync_proposals 
SET 
  final_amount = sync_fee,
  negotiated_amount = sync_fee,
  final_payment_terms = payment_terms,
  negotiated_payment_terms = payment_terms,
  negotiation_status = CASE 
    WHEN status = 'accepted' THEN 'accepted'
    WHEN status = 'declined' THEN 'rejected'
    ELSE 'pending'
  END
WHERE final_amount IS NULL 
   OR negotiated_amount IS NULL 
   OR final_payment_terms IS NULL 
   OR negotiated_payment_terms IS NULL 
   OR negotiation_status IS NULL;

-- Fix white_label_clients foreign key constraint if it doesn't exist
DO $$
BEGIN
    -- Check if the foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'white_label_clients_owner_id_fkey' 
        AND table_name = 'white_label_clients'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE white_label_clients 
        ADD CONSTRAINT white_label_clients_owner_id_fkey 
        FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Verify all columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sync_proposals' 
AND column_name IN (
    'final_amount', 
    'negotiated_amount', 
    'final_payment_terms', 
    'negotiated_payment_terms',
    'client_accepted_at', 
    'negotiation_status'
)
ORDER BY column_name; 