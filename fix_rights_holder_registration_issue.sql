-- Fix script for rights holder registration issues

-- 1. First, let's check what we have
SELECT 
  'Current state' as info,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN account_type = 'rights_holder' THEN 1 END) as rights_holders,
  COUNT(CASE WHEN account_type = 'client' THEN 1 END) as clients,
  COUNT(CASE WHEN verification_status IS NULL THEN 1 END) as null_verification
FROM profiles;

-- 2. Check for any accounts that should be rights holders but aren't
SELECT 
  'Accounts that should be rights holders' as info,
  id, 
  email, 
  account_type, 
  verification_status, 
  is_active, 
  created_at,
  company_name,
  rights_holder_type
FROM profiles 
WHERE (company_name IS NOT NULL OR rights_holder_type IS NOT NULL)
  AND account_type != 'rights_holder'
ORDER BY created_at DESC;

-- 3. Fix any accounts that should be rights holders but have wrong account_type
UPDATE profiles
SET 
  account_type = 'rights_holder',
  verification_status = 'pending',
  is_active = false
WHERE (company_name IS NOT NULL OR rights_holder_type IS NOT NULL)
  AND account_type != 'rights_holder';

-- 4. Fix any rights holders with null verification_status
UPDATE profiles
SET 
  verification_status = 'pending',
  is_active = false
WHERE account_type = 'rights_holder'
  AND (verification_status IS NULL OR verification_status = '');

-- 5. Check the results after the fix
SELECT 
  'After fix' as info,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN account_type = 'rights_holder' THEN 1 END) as rights_holders,
  COUNT(CASE WHEN account_type = 'client' THEN 1 END) as clients,
  COUNT(CASE WHEN verification_status IS NULL THEN 1 END) as null_verification
FROM profiles;

-- 6. Show all rights holders after the fix
SELECT 
  'All rights holders after fix' as info,
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

-- 7. Count by verification status for rights holders
SELECT 
  'Rights holders by verification status' as info,
  verification_status,
  COUNT(*) as count
FROM profiles 
WHERE account_type = 'rights_holder'
GROUP BY verification_status
ORDER BY verification_status;
