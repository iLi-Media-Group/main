-- Fix admin/producer account that was incorrectly converted to rights holder

-- 1. First, let's see what your account looks like
SELECT 
  'Current account state' as info,
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
WHERE email = 'mrsolowkeybeats@gmail.com';

-- 2. Fix the account type back to admin,producer
UPDATE profiles
SET 
  account_type = 'admin,producer',
  verification_status = NULL,
  is_active = true,
  company_name = NULL,
  rights_holder_type = NULL,
  business_structure = NULL,
  phone = NULL,
  address_line_1 = NULL,
  city = NULL,
  state = NULL,
  postal_code = NULL,
  country = NULL
WHERE email = 'mrsolowkeybeats@gmail.com';

-- 3. Verify the fix
SELECT 
  'Account after fix' as info,
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
WHERE email = 'mrsolowkeybeats@gmail.com';

-- 4. Show all account types to verify
SELECT 
  'All account types' as info,
  account_type,
  COUNT(*) as count
FROM profiles 
GROUP BY account_type
ORDER BY account_type; 