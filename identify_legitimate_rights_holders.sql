-- Script to properly identify legitimate rights holder registrations

-- 1. Define what a legitimate rights holder registration looks like
-- A legitimate rights holder should have:
-- - account_type = 'rights_holder'
-- - company_name IS NOT NULL (required field)
-- - rights_holder_type IS NOT NULL (required field)
-- - verification_status = 'pending' (for new registrations)

-- 2. Show accounts that meet the legitimate rights holder criteria
SELECT 
  'Legitimate rights holder registrations' as info,
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
WHERE account_type = 'rights_holder'
  AND company_name IS NOT NULL
  AND rights_holder_type IS NOT NULL
ORDER BY created_at DESC;

-- 3. Show accounts that were incorrectly converted (don't meet criteria)
SELECT 
  'Incorrectly converted accounts (should be reverted)' as info,
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
    company_name IS NULL 
    OR rights_holder_type IS NULL
    OR (first_name IS NOT NULL AND last_name IS NOT NULL AND company_name IS NULL)
  )
ORDER BY created_at DESC;

-- 4. Count legitimate vs incorrect rights holders
SELECT 
  'Rights holder classification' as info,
  CASE 
    WHEN company_name IS NOT NULL AND rights_holder_type IS NOT NULL THEN 'Legitimate'
    ELSE 'Incorrectly converted'
  END as classification,
  COUNT(*) as count
FROM profiles 
WHERE account_type = 'rights_holder'
GROUP BY 
  CASE 
    WHEN company_name IS NOT NULL AND rights_holder_type IS NOT NULL THEN 'Legitimate'
    ELSE 'Incorrectly converted'
  END
ORDER BY classification;

-- 5. Show recent registrations (last 7 days) to see if any new rights holders were created
SELECT 
  'Recent registrations (last 7 days)' as info,
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
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
