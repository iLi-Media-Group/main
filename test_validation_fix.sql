-- Test Validation Fix
-- Run this in Supabase SQL Editor to verify the fix is working

-- 1. Test the validation function with the actual invitation code
SELECT 'Testing validation function:' as step;
SELECT 
  'Validation result' as test,
  validate_producer_invitation('5oe1nuc4eabkferzhlkfnk', 'mrsolowkeybeats@gmail.com') as is_valid;

-- 2. Test the exact query that was failing in SignupForm.tsx
SELECT 'Testing the exact query that was failing:' as step;
SELECT 
  producer_number
FROM producer_invitations 
WHERE invitation_code = '5oe1nuc4eabkferzhlkfnk'
LIMIT 1;

-- 3. Test with wrong email (should return false)
SELECT 'Testing with wrong email (should return false):' as step;
SELECT 
  'Wrong email test' as test,
  validate_producer_invitation('5oe1nuc4eabkferzhlkfnk', 'wrong@email.com') as is_valid;

-- 4. Test with non-existent code (should return false)
SELECT 'Testing with non-existent code (should return false):' as step;
SELECT 
  'Non-existent code test' as test,
  validate_producer_invitation('non-existent-code', 'mrsolowkeybeats@gmail.com') as is_valid;

-- 5. Verify RLS is still enabled and policies are in place
SELECT 'Verifying RLS policies:' as step;
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'producer_invitations'
ORDER BY policyname;

-- 6. Show current invitation status
SELECT 'Current invitation status:' as info;
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
WHERE invitation_code = '5oe1nuc4eabkferzhlkfnk';
