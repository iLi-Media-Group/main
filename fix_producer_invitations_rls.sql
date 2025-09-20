-- Fix RLS policies for producer_invitations table
-- Run this in Supabase SQL Editor

-- First, let's check current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'producer_invitations';

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow admins to read producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Allow admins to insert producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Allow admins to update producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Admins can manage producer invitations" ON producer_invitations;

-- Create new, more permissive policies for admin access
CREATE POLICY "Enable read access for admins" ON producer_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );

CREATE POLICY "Enable insert access for admins" ON producer_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );

CREATE POLICY "Enable update access for admins" ON producer_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );

-- Also create a policy for service role access (for edge functions)
CREATE POLICY "Enable service role access" ON producer_invitations
  FOR ALL USING (auth.role() = 'service_role');

-- Verify the new policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'producer_invitations';

-- Test if we can query the table
SELECT COUNT(*) as invitation_count FROM producer_invitations;

-- Test if we can insert a test record
INSERT INTO producer_invitations (
  email, 
  first_name, 
  last_name, 
  producer_number, 
  invitation_code
) VALUES (
  'test2@example.com',
  'Test2',
  'User2',
  'mbfpr-002',
  'test-invitation-002'
) ON CONFLICT (invitation_code) DO NOTHING;

-- Check if the test record was inserted
SELECT * FROM producer_invitations WHERE email = 'test2@example.com';

-- Clean up test record
DELETE FROM producer_invitations WHERE email = 'test2@example.com';
