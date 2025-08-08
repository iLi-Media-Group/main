-- Immediate fix for producer_invitations table
-- Run this in Supabase SQL Editor

-- Drop the existing table if it exists (since there are multiple conflicting schemas)
DROP TABLE IF EXISTS producer_invitations CASCADE;

-- Create the producer_invitations table with the correct structure
CREATE TABLE producer_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  producer_number TEXT NOT NULL,
  invitation_code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraint to ensure producer_number format
ALTER TABLE producer_invitations 
ADD CONSTRAINT producer_invitations_producer_number_check 
CHECK (producer_number ~ '^mbfpr-\d{3}$');

-- Create indexes for efficient querying
CREATE INDEX idx_producer_invitations_email ON producer_invitations(email);
CREATE INDEX idx_producer_invitations_producer_number ON producer_invitations(producer_number);
CREATE INDEX idx_producer_invitations_invitation_code ON producer_invitations(invitation_code);
CREATE INDEX idx_producer_invitations_created_at ON producer_invitations(created_at);

-- Enable RLS
ALTER TABLE producer_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admins to read producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Allow admins to insert producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Allow admins to update producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Admins can manage producer invitations" ON producer_invitations;

-- Create RLS policies for admin access
CREATE POLICY "Allow admins to read producer invitations" ON producer_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type LIKE '%admin%'
    )
  );

CREATE POLICY "Allow admins to insert producer invitations" ON producer_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type LIKE '%admin%'
    )
  );

CREATE POLICY "Allow admins to update producer invitations" ON producer_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type LIKE '%admin%'
    )
  );

-- Add a comment to document the table purpose
COMMENT ON TABLE producer_invitations IS 'Stores producer invitation codes and details for the Quick Invite functionality';
COMMENT ON COLUMN producer_invitations.producer_number IS 'Unique producer number in format mbfpr-XXX';
COMMENT ON COLUMN producer_invitations.invitation_code IS 'Unique invitation code for producer signup';

-- Verify the table was created correctly
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'producer_invitations'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'producer_invitations';
