-- Fix producer_invitations table by adding missing producer_number column
-- This addresses the PGRST204 error about missing producer_number column

-- Add producer_number column if it doesn't exist
ALTER TABLE producer_invitations 
ADD COLUMN IF NOT EXISTS producer_number text;

-- Add constraint to ensure producer_number format (only if column exists)
DO $$ 
BEGIN
    -- Check if table exists and has the producer_number column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'producer_invitations' 
        AND column_name = 'producer_number'
    ) THEN
        -- Check if constraint doesn't already exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'producer_invitations_producer_number_check'
        ) THEN
            ALTER TABLE producer_invitations 
            ADD CONSTRAINT producer_invitations_producer_number_check 
            CHECK (producer_number ~ '^mbfpr-\d{3}$');
        END IF;
    END IF;
END $$;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_producer_invitations_producer_number 
ON producer_invitations(producer_number);

-- Show current table structure
SELECT 'Current producer_invitations table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'producer_invitations'
ORDER BY ordinal_position;

-- Show any existing data
SELECT 'Existing producer_invitations data:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    producer_number,
    invitation_code,
    created_at
FROM producer_invitations
LIMIT 5; 