-- Fix the is_active status for babyimmastarrecords@gmail.com
-- This account should be active since it's verified

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

-- 2. Fix the is_active status
UPDATE profiles
SET 
  is_active = true,
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

-- 4. Check all verified rights holders to make sure they are active
SELECT 
  'Verified rights holders check' as info,
  id,
  email,
  account_type,
  company_name,
  rights_holder_type,
  verification_status,
  is_active
FROM profiles
WHERE account_type = 'rights_holder' 
  AND verification_status = 'verified'
ORDER BY created_at DESC;
