-- Check for existing emails in profiles table
SELECT id, email, account_type, created_at 
FROM profiles 
WHERE email LIKE '%test%' OR email LIKE '%example%' OR email LIKE '%demo%'
ORDER BY created_at DESC;

-- Check for any duplicate emails
SELECT email, COUNT(*) as count
FROM profiles 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Check recent rights holder accounts
SELECT id, email, account_type, company_name, created_at 
FROM profiles 
WHERE account_type = 'rights_holder'
ORDER BY created_at DESC
LIMIT 10;

-- Optional: Delete test accounts (uncomment if needed)
-- DELETE FROM profiles WHERE email LIKE '%test%' AND created_at > NOW() - INTERVAL '1 hour';
-- DELETE FROM profiles WHERE email LIKE '%example%' AND created_at > NOW() - INTERVAL '1 hour';
