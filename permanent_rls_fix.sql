-- Permanent RLS fix for producer_invitations table
-- Run this in Supabase SQL Editor

-- First, disable RLS temporarily
ALTER TABLE producer_invitations DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow admins to read producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Allow admins to insert producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Allow admins to update producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Admins can manage producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Enable read access for admins" ON producer_invitations;
DROP POLICY IF EXISTS "Enable insert access for admins" ON producer_invitations;
DROP POLICY IF EXISTS "Enable update access for admins" ON producer_invitations;
DROP POLICY IF EXISTS "Enable service role access" ON producer_invitations;

-- Re-enable RLS
ALTER TABLE producer_invitations ENABLE ROW LEVEL SECURITY;

-- Create a simple, permissive policy for admin access
CREATE POLICY "Admin access to producer invitations" ON producer_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );

-- Also create a policy for service role access (for edge functions)
CREATE POLICY "Service role access to producer invitations" ON producer_invitations
  FOR ALL USING (auth.role() = 'service_role');

-- Test if we can query the table
SELECT COUNT(*) as invitation_count FROM producer_invitations;

-- Test if we can query by email (this was causing the 406 error)
SELECT * FROM producer_invitations WHERE email = 'babyimmastarrecords@gmail.com';

-- Verify the policies are working
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'producer_invitations';

-- Check current invitations
SELECT 
  id,
  email,
  first_name,
  last_name,
  producer_number,
  invitation_code,
  created_at
FROM producer_invitations 
ORDER BY created_at DESC;
