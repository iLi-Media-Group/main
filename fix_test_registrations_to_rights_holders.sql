-- Fix recent test registrations that should be rights holders

-- 1. First, let's see what we have
SELECT 
  'Current state before fix' as info,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN account_type = 'rights_holder' THEN 1 END) as rights_holders,
  COUNT(CASE WHEN account_type = 'client' THEN 1 END) as clients
FROM profiles 
WHERE created_at > NOW() - INTERVAL '7 days';

-- 2. Show the test registrations that need to be converted
SELECT 
  'Test registrations to convert to rights holders' as info,
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
WHERE created_at > NOW() - INTERVAL '7 days'
  AND account_type = 'client'
  AND email LIKE '%test%'
ORDER BY created_at DESC;

-- 3. Convert test registrations to rights holders
-- Since these are test accounts, we'll set them up as proper rights holders
UPDATE profiles
SET 
  account_type = 'rights_holder',
  verification_status = 'pending',
  is_active = false,
  company_name = CASE 
    WHEN email = 'test123456@test123456.com' THEN 'Test Record Label 6'
    WHEN email = 'test12345@test12345.com' THEN 'Test Record Label 5'
    WHEN email = 'test1234@example.com' THEN 'Test Record Label 4'
    WHEN email = 'test123@example.com' THEN 'Test Record Label 3'
    WHEN email = 'contactmybeatfi@gmail.com' THEN 'Test Record Label 2'
    ELSE 'Test Record Label'
  END,
  rights_holder_type = 'record_label',
  business_structure = 'llc',
  phone = '(555) 123-4567',
  address_line_1 = '123 Test Street',
  city = 'Test City',
  state = 'CA',
  postal_code = '12345',
  country = 'US'
WHERE created_at > NOW() - INTERVAL '7 days'
  AND account_type = 'client'
  AND email LIKE '%test%';

-- 4. Show the results after the fix
SELECT 
  'State after converting test registrations' as info,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN account_type = 'rights_holder' THEN 1 END) as rights_holders,
  COUNT(CASE WHEN account_type = 'client' THEN 1 END) as clients
FROM profiles 
WHERE created_at > NOW() - INTERVAL '7 days';

-- 5. Show all rights holders after the fix
SELECT 
  'All rights holders after fix' as info,
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
WHERE account_type = 'rights_holder'
ORDER BY created_at DESC;

-- 6. Count by verification status
SELECT 
  'Rights holders by verification status' as info,
  verification_status,
  COUNT(*) as count
FROM profiles 
WHERE account_type = 'rights_holder'
GROUP BY verification_status
ORDER BY verification_status;
