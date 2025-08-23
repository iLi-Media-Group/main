-- Check recent rights holder accounts (last 24 hours)
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
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Check all rights holder accounts with their verification status
SELECT 
  id, 
  email, 
  company_name,
  verification_status, 
  is_active, 
  created_at
FROM profiles 
WHERE account_type = 'rights_holder'
ORDER BY created_at DESC;

-- Count by verification status
SELECT 
  verification_status,
  COUNT(*) as count
FROM profiles 
WHERE account_type = 'rights_holder'
GROUP BY verification_status
ORDER BY verification_status;
