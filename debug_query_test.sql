-- Debug the exact query that's failing in the frontend
-- This will help us understand why the 403 error persists

-- First, let's see what user we're testing with
SELECT 
  'Current user info' as info,
  auth.uid() as user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as user_email;

-- Test the exact query that's failing
-- This should match what the frontend is trying to do
SELECT 
  id,
  email,
  status,
  company_name,
  rights_holder_type
FROM rights_holder_applications 
WHERE email = 'ilimediagroup3@gmail.com'
LIMIT 1;

-- Test with the current user's email
SELECT 
  id,
  email,
  status,
  company_name,
  rights_holder_type
FROM rights_holder_applications 
WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
LIMIT 1;

-- Check if the application exists at all
SELECT 
  'Application exists check' as check_type,
  COUNT(*) as total_applications,
  COUNT(CASE WHEN email = 'ilimediagroup3@gmail.com' THEN 1 END) as matching_email_count
FROM rights_holder_applications;

-- Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'rights_holder_applications';

-- Show all current policies
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'rights_holder_applications'
ORDER BY policyname;
