-- Comprehensive RLS fix for rights_holder_applications
-- This addresses multiple potential issues with the current policies

-- First, let's see the current state
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'No condition'
  END as policy_condition
FROM pg_policies 
WHERE tablename = 'rights_holder_applications'
ORDER BY policyname;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to read rights_holder_applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Allow authenticated users to read their own rights_holder_applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Users can read own applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Users can read own applications v2" ON rights_holder_applications;
DROP POLICY IF EXISTS "Admins can read all applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Public can insert applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Service role access" ON rights_holder_applications;

-- Create a comprehensive set of policies

-- 1. Allow authenticated users to read their own applications (multiple approaches)
CREATE POLICY "Users can read own applications by email"
ON rights_holder_applications FOR SELECT TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 2. Allow admins to read all applications
CREATE POLICY "Admins can read all applications"
ON rights_holder_applications FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
  )
);

-- 3. Allow admins to update applications
CREATE POLICY "Admins can update applications"
ON rights_holder_applications FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
  )
);

-- 4. Allow public to insert applications
CREATE POLICY "Public can insert applications"
ON rights_holder_applications FOR INSERT TO public
WITH CHECK (true);

-- 5. Allow service role full access
CREATE POLICY "Service role access"
ON rights_holder_applications FOR ALL TO service_role
USING (true);

-- Verify all policies were created
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'No condition'
  END as policy_condition
FROM pg_policies 
WHERE tablename = 'rights_holder_applications'
ORDER BY policyname;

-- Test the policy with a simple query
-- This should help us verify the policy is working
SELECT 
  'Testing RLS policy' as test,
  auth.uid() as current_user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email;
