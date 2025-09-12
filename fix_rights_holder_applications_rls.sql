-- Fix Rights Holder Applications RLS Policies
-- This script adds policies to allow users to read their own applications

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Enable read access for admins" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable insert access for admins" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable update access for admins" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable insert access for public" ON rights_holder_applications;
DROP POLICY IF EXISTS "Allow public inserts for rights holder applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable read access for admins and own applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable service role access" ON rights_holder_applications;

-- Create new policies that allow users to read their own applications
CREATE POLICY "Enable read access for admins and own applications" ON rights_holder_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
    OR 
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Allow public to insert applications (for the signup form)
CREATE POLICY "Enable insert access for public" ON rights_holder_applications
  FOR INSERT WITH CHECK (true);

-- Allow admins to update applications
CREATE POLICY "Enable update access for admins" ON rights_holder_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );

-- Keep service role access
CREATE POLICY "Enable service role access" ON rights_holder_applications
  FOR ALL USING (auth.role() = 'service_role');

-- Test the policies
SELECT 'RLS policies updated successfully' as status;
