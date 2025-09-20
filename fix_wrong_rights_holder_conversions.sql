-- Fix script to undo incorrect rights holder conversions and properly identify legitimate rights holders

-- 1. First, let's see what we have now
SELECT 
  'Current state after incorrect conversion' as info,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN account_type = 'rights_holder' THEN 1 END) as rights_holders,
  COUNT(CASE WHEN account_type = 'client' THEN 1 END) as clients
FROM profiles;

-- 2. Show all current "rights holders" to see what was incorrectly converted
SELECT 
  'All current rights holders (some may be incorrect)' as info,
  id, 
  email, 
  account_type, 
  verification_status, 
  is_active, 
  created_at,
  company_name,
  rights_holder_type,
  first_name,
  last_name
FROM profiles 
WHERE account_type = 'rights_holder'
ORDER BY created_at DESC;

-- 3. Identify accounts that were incorrectly converted (have client-like data)
SELECT 
  'Accounts that were incorrectly converted to rights holders' as info,
  id, 
  email, 
  account_type, 
  verification_status, 
  is_active, 
  created_at,
  company_name,
  rights_holder_type,
  first_name,
  last_name
FROM profiles 
WHERE account_type = 'rights_holder'
  AND (
    -- These are likely client accounts that were incorrectly converted
    (first_name IS NOT NULL AND last_name IS NOT NULL AND company_name IS NULL)
    OR 
    (rights_holder_type IS NULL AND company_name IS NULL)
    OR
    -- Check for typical client patterns
    (email LIKE '%@gmail.com' AND company_name IS NULL AND rights_holder_type IS NULL)
  )
ORDER BY created_at DESC;

-- 4. Revert incorrectly converted accounts back to client
UPDATE profiles
SET 
  account_type = 'client',
  verification_status = NULL,
  is_active = true
WHERE account_type = 'rights_holder'
  AND (
    -- These are likely client accounts that were incorrectly converted
    (first_name IS NOT NULL AND last_name IS NOT NULL AND company_name IS NULL)
    OR 
    (rights_holder_type IS NULL AND company_name IS NULL)
    OR
    -- Check for typical client patterns
    (email LIKE '%@gmail.com' AND company_name IS NULL AND rights_holder_type IS NULL)
  );

-- 5. Show the legitimate rights holders (should only be actual registrations)
SELECT 
  'Legitimate rights holders after fix' as info,
  id, 
  email, 
  account_type, 
  verification_status, 
  is_active, 
  created_at,
  company_name,
  rights_holder_type,
  first_name,
  last_name
FROM profiles 
WHERE account_type = 'rights_holder'
ORDER BY created_at DESC;

-- 6. Final count
SELECT 
  'Final state after correction' as info,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN account_type = 'rights_holder' THEN 1 END) as rights_holders,
  COUNT(CASE WHEN account_type = 'client' THEN 1 END) as clients
FROM profiles;

-- 7. Count by verification status for legitimate rights holders
SELECT 
  'Legitimate rights holders by verification status' as info,
  verification_status,
  COUNT(*) as count
FROM profiles 
WHERE account_type = 'rights_holder'
GROUP BY verification_status
ORDER BY verification_status;
