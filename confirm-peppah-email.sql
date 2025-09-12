-- Confirm Peppah Email Address
-- This script confirms the email for the peppah user

-- 1. First, let's see the current state
SELECT 'CURRENT STATE:' as info;

SELECT 'AUTH USERS:' as table_name, id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'peppah.tracks@gmail.com';

SELECT 'PROFILES:' as table_name, id, email, account_type, created_at, updated_at 
FROM profiles 
WHERE email = 'peppah.tracks@gmail.com';

-- 2. Confirm the email address
SELECT 'CONFIRMING EMAIL:' as info;

UPDATE auth.users 
SET email_confirmed_at = now(),
    updated_at = now()
WHERE email = 'peppah.tracks@gmail.com';

-- 3. Verify the confirmation
SELECT 'AFTER CONFIRMATION:' as info;

SELECT 'AUTH USERS:' as table_name, id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'peppah.tracks@gmail.com';

-- 4. Test the linkage
SELECT 'LINKAGE TEST:' as info;
SELECT 
  au.id,
  au.email as auth_email,
  au.email_confirmed_at,
  p.email as profile_email,
  p.account_type,
  CASE WHEN p.id IS NOT NULL THEN 'LINKED' ELSE 'UNLINKED' END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'peppah.tracks@gmail.com';

-- 5. Ready for testing
SELECT 'READY FOR TESTING:' as info;
SELECT 
  'peppah.tracks@gmail.com' as email,
  'Mbfpr123!' as password,
  'producer' as account_type,
  au.id as user_id,
  CASE WHEN au.email_confirmed_at IS NOT NULL THEN 'EMAIL CONFIRMED' ELSE 'EMAIL NOT CONFIRMED' END as email_status
FROM auth.users au
WHERE au.email = 'peppah.tracks@gmail.com';
