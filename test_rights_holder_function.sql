-- Test script to verify rights holder registration function

-- 1. Check if there are any recent registrations that should be rights holders
SELECT 
  'Recent registrations that should be rights holders' as info,
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
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND (
    company_name IS NOT NULL 
    OR rights_holder_type IS NOT NULL
    OR business_structure IS NOT NULL
  )
ORDER BY created_at DESC;

-- 2. Check if any of these have the wrong account_type
SELECT 
  'Accounts with rights holder data but wrong account_type' as info,
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
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND account_type = 'client'
  AND (
    company_name IS NOT NULL 
    OR rights_holder_type IS NOT NULL
    OR business_structure IS NOT NULL
  )
ORDER BY created_at DESC;

-- 3. Check if the signUpRightsHolder function is being called
-- Look for any profiles with account_type = 'rights_holder' in the last 24 hours
SELECT 
  'Rights holder registrations in last 24 hours' as info,
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
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND account_type = 'rights_holder'
ORDER BY created_at DESC;

-- 4. Check for any error patterns in recent registrations
SELECT 
  'All recent registrations with patterns' as info,
  id, 
  email, 
  account_type, 
  verification_status, 
  is_active, 
  created_at,
  company_name,
  rights_holder_type,
  business_structure,
  first_name,
  last_name
FROM profiles 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
