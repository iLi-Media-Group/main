-- Run this SQL in your Supabase dashboard SQL editor to fix the missing columns

-- Add final_amount column if it doesn't exist
ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS final_amount numeric(10,2);

-- Add negotiated_amount column if it doesn't exist
ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS negotiated_amount numeric(10,2);

-- Add client_accepted_at column if it doesn't exist
ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS client_accepted_at timestamp with time zone;

-- Add negotiation_status column if it doesn't exist (with correct constraint values)
ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS negotiation_status text DEFAULT 'pending' CHECK (negotiation_status IN ('pending', 'negotiating', 'client_acceptance_required', 'accepted', 'rejected'));

-- Update existing records to have default values based on their current status
UPDATE sync_proposals 
SET 
  final_amount = sync_fee,
  negotiated_amount = sync_fee,
  negotiation_status = CASE 
    WHEN status = 'accepted' THEN 'accepted'
    WHEN status = 'declined' THEN 'rejected'
    ELSE 'pending'
  END
WHERE final_amount IS NULL 
   OR negotiated_amount IS NULL 
   OR negotiation_status IS NULL;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sync_proposals' 
AND column_name IN ('final_amount', 'negotiated_amount', 'client_accepted_at', 'negotiation_status')
ORDER BY column_name; 