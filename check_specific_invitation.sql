-- Check Specific Invitation Code
-- Replace 'INVITATION_CODE_HERE' with the actual invitation code the user received
-- Replace 'USER_EMAIL_HERE' with the actual email the user is using

-- Check if the invitation exists
SELECT 'Checking invitation existence:' as step;
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
    WHEN email IS NOT NULL AND email != 'USER_EMAIL_HERE' THEN 'Email mismatch'
    ELSE 'Valid'
  END as status
FROM producer_invitations 
WHERE invitation_code = 'INVITATION_CODE_HERE';

-- Test the validation function with the actual code
SELECT 'Testing validation function:' as step;
SELECT 
  validate_producer_invitation('INVITATION_CODE_HERE', 'USER_EMAIL_HERE') as validation_result;

-- Test the exact query that fails in SignupForm.tsx
SELECT 'Testing the exact query that fails:' as step;
SELECT 
  producer_number
FROM producer_invitations 
WHERE invitation_code = 'INVITATION_CODE_HERE'
LIMIT 1;

-- Check if there are any invitations for this email
SELECT 'Checking all invitations for this email:' as step;
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
WHERE email = 'USER_EMAIL_HERE'
ORDER BY created_at DESC;

-- Check if the invitation code exists but with different email
SELECT 'Checking if code exists with different email:' as step;
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
WHERE invitation_code = 'INVITATION_CODE_HERE';
