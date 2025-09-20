-- Immediate fix for producer_invitations RLS policies
-- Run this in Supabase SQL Editor

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow admins to read producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Allow admins to insert producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Allow admins to update producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Admins can manage producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Enable read access for admins" ON producer_invitations;
DROP POLICY IF EXISTS "Enable insert access for admins" ON producer_invitations;
DROP POLICY IF EXISTS "Enable update access for admins" ON producer_invitations;
DROP POLICY IF EXISTS "Enable service role access" ON producer_invitations;

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

-- Test if we can query by email
SELECT * FROM producer_invitations WHERE email = 'babyimmastarrecords@gmail.com';
