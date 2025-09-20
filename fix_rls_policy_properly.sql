-- Fix RLS Policy for Rights Holder Applications Properly
-- This creates a working RLS policy for production use

-- First, let's see what policies currently exist
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'rights_holder_applications'
ORDER BY policyname;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable read access for admins" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable insert access for admins" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable update access for admins" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable insert access for public" ON rights_holder_applications;
DROP POLICY IF EXISTS "Allow public inserts for rights holder applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable read access for admins and own applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable service role access" ON rights_holder_applications;
DROP POLICY IF EXISTS "Users can read own applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Users can read own applications v2" ON rights_holder_applications;
DROP POLICY IF EXISTS "Admins can read all applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Public can insert applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Service role access" ON rights_holder_applications;

-- Create a simple, working policy for users to read their own applications
-- This policy allows users to read applications where the email matches their auth email
CREATE POLICY "Users can read own applications" ON rights_holder_applications
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Create policy for admins to read all applications
CREATE POLICY "Admins can read all applications" ON rights_holder_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );

-- Create policy for public to insert applications (for signup form)
CREATE POLICY "Public can insert applications" ON rights_holder_applications
  FOR INSERT WITH CHECK (true);

-- Create policy for admins to update applications
CREATE POLICY "Admins can update applications" ON rights_holder_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );

-- Create policy for service role access
CREATE POLICY "Service role access" ON rights_holder_applications
  FOR ALL USING (auth.role() = 'service_role');

-- Test the policies by showing what we created
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'rights_holder_applications'
ORDER BY policyname;

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'rights_holder_applications';

SELECT 'RLS policies fixed and ready for production' as status;
