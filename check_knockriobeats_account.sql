-- Check knockriobeats@gmail.com account type
SELECT
  'knockriobeats@gmail.com account info' as info,
  id,
  email,
  account_type,
  verification_status,
  is_active,
  created_at,
  company_name,
  rights_holder_type,
  business_structure
FROM profiles
WHERE email = 'knockriobeats@gmail.com';

-- Check all account types to see the distribution
SELECT
  'All account types' as info,
  account_type,
  COUNT(*) as count
FROM profiles
GROUP BY account_type
ORDER BY account_type;
