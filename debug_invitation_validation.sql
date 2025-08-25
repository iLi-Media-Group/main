-- Debug invitation validation
-- Run this in Supabase SQL Editor

-- Check all invitations
SELECT 
  id,
  email,
  first_name,
  last_name,
  producer_number,
  invitation_code,
  used,
  created_at,
  expires_at
FROM producer_invitations 
ORDER BY created_at DESC;

-- Check for the specific invitation code being used
-- Replace 'your-actual-code' with the invitation code you're trying to use
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
    WHEN expires_at < NOW() THEN 'Expired'
    WHEN email IS NOT NULL AND email != 'babyimmastarrecords@gmail.com' THEN 'Email mismatch'
    ELSE 'Valid'
  END as status
FROM producer_invitations 
WHERE invitation_code = 'your-actual-code';

-- Test the validation function with the actual code
-- Replace 'your-actual-code' with the real invitation code
SELECT 
  'Testing validation' as test,
  validate_producer_invitation('your-actual-code', 'babyimmastarrecords@gmail.com') as is_valid;

-- Show all unused invitations for babyimmastarrecords@gmail.com
SELECT 
  id,
  email,
  first_name,
  last_name,
  producer_number,
  invitation_code,
  used,
  created_at
FROM producer_invitations 
WHERE email = 'babyimmastarrecords@gmail.com'
  AND (used IS NULL OR used = FALSE)
ORDER BY created_at DESC;
