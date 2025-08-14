-- Diagnose Producer Signup Issue
-- Run this in Supabase SQL Editor to identify the problem

-- 1. Check if producer_invitations table exists and has data
SELECT 'Step 1: Check table existence and data' as step;
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'producer_invitations'
  ) as table_exists;

SELECT COUNT(*) as total_invitations FROM producer_invitations;

-- 2. Check RLS status on producer_invitations table
SELECT 'Step 2: Check RLS status' as step;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'producer_invitations';

-- 3. Check RLS policies
SELECT 'Step 3: Check RLS policies' as step;
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'producer_invitations';

-- 4. Show all recent producer invitations
SELECT 'Step 4: Recent producer invitations' as step;
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
ORDER BY created_at DESC
LIMIT 10;

-- 5. Test the validate_producer_invitation function
SELECT 'Step 5: Test validation function' as step;
-- Replace 'TEST_CODE' with an actual invitation code from step 4
SELECT 
  'Testing with sample code' as test,
  validate_producer_invitation('TEST_CODE', 'test@example.com') as is_valid;

-- 6. Check if the function exists
SELECT 'Step 6: Check function exists' as step;
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE proname = 'validate_producer_invitation';

-- 7. Test direct query to producer_invitations (this is what's failing)
SELECT 'Step 7: Test direct query (this is what fails in signup)' as step;
-- This simulates the exact query that fails in SignupForm.tsx
SELECT 
  producer_number
FROM producer_invitations 
WHERE invitation_code = 'TEST_CODE'
LIMIT 1;

-- 8. Check user permissions
SELECT 'Step 8: Check current user permissions' as step;
SELECT current_user, session_user;

-- 9. Test with a real invitation code (replace with actual code)
SELECT 'Step 9: Test with real invitation code' as step;
-- Replace 'REAL_CODE' with the actual invitation code the user is trying to use
-- Replace 'USER_EMAIL' with the actual email the user is using
SELECT 
  'Real invitation test' as test,
  invitation_code,
  email,
  producer_number,
  used,
  expires_at,
  validate_producer_invitation('REAL_CODE', 'USER_EMAIL') as validation_result
FROM producer_invitations 
WHERE invitation_code = 'REAL_CODE';
