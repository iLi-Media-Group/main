-- Create producer_invitations table with all necessary columns
-- This ensures the table exists with the correct structure

CREATE TABLE IF NOT EXISTS producer_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  producer_number TEXT NOT NULL,
  invitation_code TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraint to ensure producer_number format
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'producer_invitations_producer_number_check'
    ) THEN
        ALTER TABLE producer_invitations 
        ADD CONSTRAINT producer_invitations_producer_number_check 
        CHECK (producer_number ~ '^mbfpr-\d{3}$');
    END IF;
END $$;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_producer_invitations_email 
ON producer_invitations(email);

CREATE INDEX IF NOT EXISTS idx_producer_invitations_producer_number 
ON producer_invitations(producer_number);

CREATE INDEX IF NOT EXISTS idx_producer_invitations_invitation_code 
ON producer_invitations(invitation_code);

-- Add RLS policies
ALTER TABLE producer_invitations ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all invitations
CREATE POLICY "Allow admins to read producer invitations" ON producer_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type LIKE '%admin%'
    )
  );

-- Allow admins to insert invitations
CREATE POLICY "Allow admins to insert producer invitations" ON producer_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type LIKE '%admin%'
    )
  );

-- Allow admins to update invitations
CREATE POLICY "Allow admins to update producer invitations" ON producer_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type LIKE '%admin%'
    )
  );

-- Show the complete table structure
SELECT 'Producer invitations table structure:' as info;
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