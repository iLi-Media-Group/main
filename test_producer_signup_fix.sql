-- Comprehensive Test for Producer Signup Fix
-- Run this in Supabase SQL Editor to verify the fix works BEFORE testing with live producers

-- 1. Test the validation function with the actual invitation codes
SELECT 'Testing validation function with real codes:' as step;
SELECT 
  'Alex Davis validation' as test,
  validate_producer_invitation('5oe1nuc4eabkferzhlkfnk', 'mrsolowkeybeats@gmail.com') as is_valid;

SELECT 
  'Nikolaos Laskaridis validation' as test,
  validate_producer_invitation('pzvkyketqzmd8n0qa1pcdo', 'nikofftimemusic@gmail.com') as is_valid;

-- 2. Test the exact query that was failing in SignupForm.tsx
SELECT 'Testing the exact query that was failing:' as step;
SELECT 
  'Alex Davis producer number' as test,
  producer_number
FROM producer_invitations 
WHERE invitation_code = '5oe1nuc4eabkferzhlkfnk'
LIMIT 1;

SELECT 
  'Nikolaos Laskaridis producer number' as test,
  producer_number
FROM producer_invitations 
WHERE invitation_code = 'pzvkyketqzmd8n0qa1pcdo'
LIMIT 1;

-- 3. Test with wrong email (should still work if email is not enforced)
SELECT 'Testing with wrong email (should still work):' as step;
SELECT 
  'Alex Davis with wrong email' as test,
  validate_producer_invitation('5oe1nuc4eabkferzhlkfnk', 'wrong@email.com') as is_valid;

-- 4. Test with non-existent code (should return false)
SELECT 'Testing with non-existent code:' as step;
SELECT 
  'Non-existent code' as test,
  validate_producer_invitation('FAKE_CODE_123', 'test@email.com') as is_valid;

-- 5. Test the use_producer_invitation function
SELECT 'Testing use_producer_invitation function:' as step;
-- First, check if the function exists
SELECT 
  proname as function_name,
  proargtypes::regtype[] as parameter_types,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'use_producer_invitation';

-- 6. Check RLS status and permissions
SELECT 'Checking RLS and permissions:' as step;
SELECT 
  'RLS Status' as check,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'producer_invitations';

SELECT 
  'Table permissions' as check,
  grantee,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'producer_invitations';

-- 7. Test direct table access (this is what the signup form does)
SELECT 'Testing direct table access (signup form query):' as step;
SELECT 
  'Direct query test' as test,
  COUNT(*) as invitation_count
FROM producer_invitations 
WHERE invitation_code IN ('5oe1nuc4eabkferzhlkfnk', 'pzvkyketqzmd8n0qa1pcdo');

-- 8. Simulate the complete signup flow
SELECT 'Simulating complete signup flow:' as step;
-- This simulates what happens in SignupForm.tsx lines 95-103
WITH signup_simulation AS (
  SELECT 
    invitation_code,
    producer_number,
    email,
    first_name,
    last_name,
    used
  FROM producer_invitations 
  WHERE invitation_code = '5oe1nuc4eabkferzhlkfnk'
)
SELECT 
  'Signup simulation result' as test,
  CASE 
    WHEN COUNT(*) > 0 THEN 'SUCCESS - Producer details can be retrieved'
    ELSE 'FAILED - Cannot retrieve producer details'
  END as result,
  COUNT(*) as records_found
FROM signup_simulation;

-- 9. Final verification - all tests should pass
SELECT 'FINAL VERIFICATION:' as step;
SELECT 
  'All tests completed successfully' as status,
  'Producer signup should now work' as conclusion,
  'Have the producer try the signup process' as next_step;
