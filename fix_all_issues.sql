-- Comprehensive fix for all remaining issues
-- Run this in Supabase SQL Editor

-- 1. Fix RLS policies for producer_invitations
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

-- 2. Check current invitations
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

-- 3. Test if we can query by email (this was causing the 406 error)
SELECT * FROM producer_invitations WHERE email = 'babyimmastarrecords@gmail.com';

-- 4. Check email_logs table
SELECT 
  id,
  to_email,
  subject,
  status,
  created_at
FROM email_logs 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Verify RLS policies are working
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'producer_invitations';
