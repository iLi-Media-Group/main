-- Check current rights holder verification status
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
ORDER BY created_at DESC;

-- Check for any rights holders without proper verification status
SELECT 
  id, 
  email, 
  company_name,
  verification_status, 
  is_active
FROM profiles 
WHERE account_type = 'rights_holder' 
  AND (verification_status IS NULL OR verification_status = '' OR verification_status NOT IN ('pending', 'verified', 'rejected', 'suspended'))
ORDER BY created_at DESC;

-- Fix rights holders without proper verification status
-- Set all rights holders to pending unless they were manually verified
UPDATE profiles 
SET 
  verification_status = 'pending',
  is_active = false
WHERE 
  account_type = 'rights_holder' 
  AND (verification_status IS NULL OR verification_status = '' OR verification_status NOT IN ('pending', 'verified', 'rejected', 'suspended'));

-- Check the results after the fix
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
ORDER BY created_at DESC;

-- Count by verification status
SELECT 
  verification_status,
  COUNT(*) as count
FROM profiles 
WHERE account_type = 'rights_holder'
GROUP BY verification_status
ORDER BY verification_status;
