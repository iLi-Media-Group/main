-- Check the differences between producer and rights holder profiles
-- This will help us understand if there's a profile-related issue

-- Check the profiles for the test accounts
SELECT 
  id,
  email,
  account_type,
  first_name,
  last_name,
  company_name,
  verification_status,
  terms_accepted,
  rights_authority_declaration_accepted,
  created_at
FROM profiles 
WHERE email IN ('babyimmastarrecords@gmail.com', 'ilimediagroup@gmail.com', 'knockriobeats@gmail.com', 'mrsolowkeybeats@gmail.com')
ORDER BY email;

-- Check what account types exist
SELECT DISTINCT account_type, COUNT(*) as count
FROM profiles 
GROUP BY account_type
ORDER BY account_type;

-- Check if there are any producers that are successfully accessing custom sync requests
-- Let's see what producers exist and their account types
SELECT 
  id,
  email,
  account_type,
  first_name,
  last_name,
  verification_status
FROM profiles 
WHERE account_type = 'producer'
LIMIT 10;

-- Check if there are any rights holders and their account types
SELECT 
  id,
  email,
  account_type,
  first_name,
  last_name,
  verification_status
FROM profiles 
WHERE account_type = 'rights_holder'
LIMIT 10;

-- Check if the RLS policy is checking for specific account types
-- Let's see what the current RLS policies are checking
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'custom_sync_requests'
ORDER BY policyname;
