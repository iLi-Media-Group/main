-- Comprehensive fix for rights holder registration issues

-- 1. First, let's clean up the recent test registrations that were created incorrectly
-- These are client accounts that should be deleted since they're test accounts
DELETE FROM profiles 
WHERE created_at > NOW() - INTERVAL '7 days'
  AND account_type = 'client'
  AND email LIKE '%test%'
  AND company_name IS NULL
  AND rights_holder_type IS NULL;

-- 2. Check if there are any accounts that should be rights holders but were created as clients
SELECT 
  'Accounts that should be rights holders but were created as clients' as info,
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
WHERE account_type = 'client'
  AND (
    company_name IS NOT NULL 
    OR rights_holder_type IS NOT NULL
    OR business_structure IS NOT NULL
  )
ORDER BY created_at DESC;

-- 3. Convert any accounts that should be rights holders
UPDATE profiles
SET 
  account_type = 'rights_holder',
  verification_status = 'pending',
  is_active = false
WHERE account_type = 'client'
  AND (
    company_name IS NOT NULL 
    OR rights_holder_type IS NOT NULL
    OR business_structure IS NOT NULL
  );

-- 4. Show the final state
SELECT 
  'Final state after cleanup' as info,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN account_type = 'rights_holder' THEN 1 END) as rights_holders,
  COUNT(CASE WHEN account_type = 'client' THEN 1 END) as clients
FROM profiles;

-- 5. Show all legitimate rights holders
SELECT 
  'All legitimate rights holders' as info,
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
