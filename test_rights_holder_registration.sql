-- Test script to check rights holder registration process

-- 1. Check current rights holder accounts
SELECT 
  id, 
  email, 
  account_type, 
  verification_status, 
  is_active, 
  created_at,
  company_name
FROM profiles 
WHERE account_type = 'rights_holder'
ORDER BY created_at DESC;

-- 2. Check for any recent accounts (last 24 hours)
SELECT 
  id, 
  email, 
  account_type, 
  verification_status, 
  is_active, 
  created_at,
  company_name
FROM profiles 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 3. Check for any accounts with null or empty verification_status
SELECT 
  id, 
  email, 
  account_type, 
  verification_status, 
  is_active, 
  created_at,
  company_name
FROM profiles 
WHERE account_type = 'rights_holder'
  AND (verification_status IS NULL OR verification_status = '')
ORDER BY created_at DESC;

-- 4. Count by verification status
SELECT 
  verification_status,
  COUNT(*) as count
FROM profiles 
WHERE account_type = 'rights_holder'
GROUP BY verification_status
ORDER BY verification_status;

-- 5. Check for any accounts that might be created as clients instead of rights holders
SELECT 
  id, 
  email, 
  account_type, 
  verification_status, 
  is_active, 
  created_at,
  company_name
FROM profiles 
WHERE email LIKE '%test%' OR email LIKE '%example%'
ORDER BY created_at DESC;
