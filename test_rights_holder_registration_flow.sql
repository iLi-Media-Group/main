-- Test script to verify rights holder registration flow

-- 1. Check if there are any recent test accounts that might be causing issues
SELECT 
  id, 
  email, 
  account_type, 
  verification_status, 
  is_active, 
  created_at,
  company_name,
  rights_holder_type
FROM profiles 
WHERE email LIKE '%test%' OR email LIKE '%example%'
ORDER BY created_at DESC;

-- 2. Check for any accounts that might have been created with wrong account_type
SELECT 
  id, 
  email, 
  account_type, 
  verification_status, 
  is_active, 
  created_at,
  company_name
FROM profiles 
WHERE (company_name IS NOT NULL OR rights_holder_type IS NOT NULL)
  AND account_type != 'rights_holder'
ORDER BY created_at DESC;

-- 3. Check for any accounts with null verification_status
SELECT 
  id, 
  email, 
  account_type, 
  verification_status, 
  is_active, 
  created_at,
  company_name
FROM profiles 
WHERE verification_status IS NULL
ORDER BY created_at DESC;

-- 4. Check all rights holder accounts and their status
SELECT 
  id, 
  email, 
  account_type, 
  verification_status, 
  is_active, 
  created_at,
  company_name,
  rights_holder_type
FROM profiles 
WHERE account_type = 'rights_holder'
ORDER BY created_at DESC;

-- 5. Count by verification status for rights holders
SELECT 
  verification_status,
  COUNT(*) as count
FROM profiles 
WHERE account_type = 'rights_holder'
GROUP BY verification_status
ORDER BY verification_status;

-- 6. Check for any orphaned auth users (users without profiles)
-- This would require checking the auth.users table, but we can't access it directly
-- Instead, let's check for any profiles that might be missing critical fields

-- 7. Check for any accounts that might have been created with wrong account_type
SELECT 
  id, 
  email, 
  account_type, 
  verification_status, 
  is_active, 
  created_at,
  company_name
FROM profiles 
WHERE account_type = 'client' 
  AND (company_name IS NOT NULL OR rights_holder_type IS NOT NULL)
ORDER BY created_at DESC;
