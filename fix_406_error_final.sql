-- Final fix for 406 error on producer_invitations
-- Run this in Supabase SQL Editor

-- Completely disable RLS on producer_invitations
ALTER TABLE producer_invitations DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean state
DROP POLICY IF EXISTS "Allow admins to read producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Allow admins to insert producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Allow admins to update producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Admins can manage producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Enable read access for admins" ON producer_invitations;
DROP POLICY IF EXISTS "Enable insert access for admins" ON producer_invitations;
DROP POLICY IF EXISTS "Enable update access for admins" ON producer_invitations;
DROP POLICY IF EXISTS "Enable service role access" ON producer_invitations;
DROP POLICY IF EXISTS "Admin access to producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Service role access to producer invitations" ON producer_invitations;

-- Test that we can now query the table
SELECT COUNT(*) as invitation_count FROM producer_invitations;

-- Test the specific query that was failing
SELECT * FROM producer_invitations WHERE email = 'babyimmastarrecords@gmail.com';

-- Show current invitations
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

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'producer_invitations';
