-- Check current rights holder verification status
SELECT 
  id, 
  email, 
  account_type, 
  verification_status, 
  is_active, 
  created_at
FROM profiles 
WHERE account_type = 'rights_holder'
ORDER BY created_at DESC;

-- Fix rights holders without verification status
UPDATE profiles 
SET 
  verification_status = 'pending',
  is_active = false
WHERE 
  account_type = 'rights_holder' 
  AND (verification_status IS NULL OR verification_status = '');

-- Check the results after the fix
SELECT 
  id, 
  email, 
  account_type, 
  verification_status, 
  is_active, 
  created_at
FROM profiles 
WHERE account_type = 'rights_holder'
ORDER BY created_at DESC;
