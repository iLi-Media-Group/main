-- Simple Fix for Rights Holder Applications RLS Policies
-- This script creates a simple policy that allows users to read their own applications

-- First, disable RLS temporarily to see what's in the table
ALTER TABLE rights_holder_applications DISABLE ROW LEVEL SECURITY;

-- Let's see what's in the table
SELECT id, email, status, company_name FROM rights_holder_applications LIMIT 5;

-- Now re-enable RLS
ALTER TABLE rights_holder_applications ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for admins" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable insert access for admins" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable update access for admins" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable insert access for public" ON rights_holder_applications;
DROP POLICY IF EXISTS "Allow public inserts for rights holder applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable read access for admins and own applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable service role access" ON rights_holder_applications;

-- Create a simple policy that allows users to read applications where email matches their auth email
CREATE POLICY "Users can read own applications" ON rights_holder_applications
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Allow admins to read all applications
CREATE POLICY "Admins can read all applications" ON rights_holder_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );

-- Allow public to insert applications
CREATE POLICY "Public can insert applications" ON rights_holder_applications
  FOR INSERT WITH CHECK (true);

-- Allow admins to update applications
CREATE POLICY "Admins can update applications" ON rights_holder_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );

-- Allow service role access
CREATE POLICY "Service role access" ON rights_holder_applications
  FOR ALL USING (auth.role() = 'service_role');

-- Test the policies
SELECT 'RLS policies updated successfully' as status;
