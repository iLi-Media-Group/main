-- Diagnostic Script for Producer Signup Issues
-- Run this in Supabase SQL Editor to check the current state

-- 1. Check if producer_invitations table exists and its structure
SELECT 'Checking table structure:' as step;
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'producer_invitations'
ORDER BY ordinal_position;

-- 2. Check RLS status
SELECT 'Checking RLS status:' as step;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'producer_invitations';

-- 3. Check current RLS policies
SELECT 'Checking RLS policies:' as step;
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'producer_invitations';

-- 4. Check if validation function exists
SELECT 'Checking validation function:' as step;
SELECT 
  proname as function_name,
  proargtypes::regtype[] as parameter_types,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'validate_producer_invitation';

-- 5. Check current invitations
SELECT 'Checking current invitations:' as step;
SELECT 
  id,
  email,
  first_name,
  last_name,
  producer_number,
  invitation_code,
  used,
  created_at,
  expires_at,
  CASE 
    WHEN used = TRUE THEN 'Already used'
    WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'Expired'
    ELSE 'Valid'
  END as status
FROM producer_invitations 
ORDER BY created_at DESC;

-- 6. Test validation function with a real invitation code
SELECT 'Testing validation function:' as step;
-- Replace 'TEST_CODE' with an actual invitation code from step 5
SELECT 
  'Validation test' as test,
  validate_producer_invitation('TEST_CODE', 'test@example.com') as is_valid;

-- 7. Test the exact query that fails in SignupForm.tsx
SELECT 'Testing the exact query that fails:' as step;
-- Replace 'TEST_CODE' with an actual invitation code from step 5
SELECT 
  producer_number
FROM producer_invitations 
WHERE invitation_code = 'TEST_CODE'
LIMIT 1;

-- 8. Check permissions
SELECT 'Checking permissions:' as step;
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'producer_invitations';

-- 9. Check function permissions
SELECT 'Checking function permissions:' as step;
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_routine_grants 
WHERE routine_name = 'validate_producer_invitation';
