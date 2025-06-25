-- Add missing payment_due_date column to sync_proposals table
ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS payment_due_date timestamptz;

-- Add other missing payment columns if they don't exist
ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS final_amount integer;

ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS payment_status text;

ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;

ALTER TABLE sync_proposals 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text; 