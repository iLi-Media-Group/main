-- Debug script to investigate rights holder registration issues

-- 1. Check all recent profiles (last 24 hours)
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
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 2. Check all rights holder accounts
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

-- 3. Check for any accounts with wrong account_type
SELECT 
  id, 
  email, 
  account_type, 
  verification_status, 
  is_active, 
  created_at,
  company_name
FROM profiles 
WHERE account_type != 'rights_holder' 
  AND (company_name IS NOT NULL OR rights_holder_type IS NOT NULL)
ORDER BY created_at DESC;

-- 4. Check for any accounts with null verification_status
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

-- 5. Count by account_type
SELECT 
  account_type,
  COUNT(*) as count
FROM profiles 
GROUP BY account_type
ORDER BY account_type;

-- 6. Count rights holders by verification_status
SELECT 
  verification_status,
  COUNT(*) as count
FROM profiles 
WHERE account_type = 'rights_holder'
GROUP BY verification_status
ORDER BY verification_status;

-- 7. Check for any duplicate emails
SELECT 
  email,
  COUNT(*) as count
FROM profiles 
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;
