-- Check recent test registrations to understand what went wrong

-- 1. Check all recent registrations with their full data
SELECT 
  'Recent registrations with full data' as info,
  id, 
  email, 
  account_type, 
  verification_status, 
  is_active, 
  created_at,
  company_name,
  rights_holder_type,
  first_name,
  last_name,
  business_structure,
  phone,
  address_line_1,
  city,
  state,
  postal_code,
  country
FROM profiles 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 2. Check if any of these have rights holder data but wrong account_type
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
  business_structure,
  phone,
  address_line_1,
  city,
  state
FROM profiles 
WHERE created_at > NOW() - INTERVAL '7 days'
  AND (
    company_name IS NOT NULL 
    OR rights_holder_type IS NOT NULL
    OR business_structure IS NOT NULL
  )
ORDER BY created_at DESC;

-- 3. Check for any accounts that might have been created through the wrong signup process
SELECT 
  'Accounts that look like they should be rights holders' as info,
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
  AND (
    company_name IS NOT NULL 
    OR rights_holder_type IS NOT NULL
    OR business_structure IS NOT NULL
  )
ORDER BY created_at DESC;
