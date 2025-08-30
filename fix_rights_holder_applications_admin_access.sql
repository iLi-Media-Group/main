-- Fix Rights Holder Applications Admin Access
-- This ensures admin users can properly view and manage applications

-- First, let's check the current state
SELECT 'Current admin user:' as info;
SELECT 
  id,
  email,
  account_type,
  verification_status
FROM profiles 
WHERE account_type LIKE '%admin%';

-- Check current RLS policies
SELECT 'Current RLS policies:' as info;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'rights_holder_applications';

-- Drop and recreate the admin read policy with more explicit conditions
DROP POLICY IF EXISTS "Enable read access for admins" ON rights_holder_applications;

CREATE POLICY "Enable read access for admins" ON rights_holder_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.account_type = 'admin' OR 
        profiles.account_type = 'admin,producer' OR
        profiles.account_type LIKE '%admin%'
      )
    )
  );

-- Also add a service role policy to ensure admin dashboard can access
DROP POLICY IF EXISTS "Enable service role access" ON rights_holder_applications;

CREATE POLICY "Enable service role access" ON rights_holder_applications
  FOR ALL USING (auth.role() = 'service_role');

-- Test the policies by checking if admin can read
SELECT 'Testing admin access - should show all records:' as info;
SELECT 
  id, 
  company_name, 
  email, 
  rights_holder_type, 
  status, 
  created_at 
FROM rights_holder_applications 
ORDER BY created_at DESC;

-- Show final policy list
SELECT 'Final RLS policies:' as info;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'rights_holder_applications'
ORDER BY policyname;
