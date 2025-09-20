-- Update rights_holder_applications table for new approval flow
-- This removes the need for password storage since accounts are created immediately

-- Note: We're not adding password_hash field since accounts are created immediately
-- and access is controlled by verification_status in profiles and rights_holders tables

-- Update the RLS policy to allow public users to insert applications
-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert access for admins" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable insert access for public" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable read access for admins" ON rights_holder_applications;
DROP POLICY IF EXISTS "Enable update access for admins" ON rights_holder_applications;

-- Create the public insert policy
CREATE POLICY "Enable insert access for public" ON rights_holder_applications
  FOR INSERT WITH CHECK (true);

-- Create the admin read policy
CREATE POLICY "Enable read access for admins" ON rights_holder_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );

-- Create the admin update policy
CREATE POLICY "Enable update access for admins" ON rights_holder_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );
