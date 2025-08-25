-- Fix the rights_holder_type for babyimmastarrecords@gmail.com
-- This account should have rights_holder_type = 'record_label'

-- 1. Check current state
SELECT 
  'Current state' as info,
  id,
  email,
  account_type,
  company_name,
  rights_holder_type,
  verification_status,
  is_active
FROM profiles
WHERE email = 'babyimmastarrecords@gmail.com';

-- 2. Fix the rights_holder_type
UPDATE profiles
SET 
  rights_holder_type = 'record_label',
  updated_at = NOW()
WHERE email = 'babyimmastarrecords@gmail.com';

-- 3. Verify the fix
SELECT 
  'After fix' as info,
  id,
  email,
  account_type,
  company_name,
  rights_holder_type,
  verification_status,
  is_active
FROM profiles
WHERE email = 'babyimmastarrecords@gmail.com';

-- 4. Check all rights holders to make sure they have proper rights_holder_type
SELECT 
  'All rights holders check' as info,
  id,
  email,
  account_type,
  company_name,
  rights_holder_type,
  verification_status,
  is_active
FROM profiles
WHERE account_type = 'rights_holder'
ORDER BY created_at DESC;
