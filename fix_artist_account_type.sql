-- CRITICAL SECURITY FIX: Fix artist account type corruption
-- This script fixes artists who are incorrectly identified as rights holders

-- 1. First, let's see what we have
SELECT 
  'Current state - artists incorrectly identified as rights holders' as info,
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
  artist_number
FROM profiles 
WHERE account_type = 'rights_holder'
  AND (
    -- These are likely artist accounts that were incorrectly converted
    (first_name IS NOT NULL AND last_name IS NOT NULL AND company_name IS NULL)
    OR 
    (artist_number IS NOT NULL)
    OR
    -- Check for typical artist patterns
    (email LIKE '%@gmail.com' AND company_name IS NULL AND rights_holder_type IS NULL)
  )
ORDER BY created_at DESC;

-- 2. Fix the account types for artists who were incorrectly converted
UPDATE profiles
SET 
  account_type = 'artist_band',
  verification_status = NULL,
  is_active = true,
  company_name = NULL,
  rights_holder_type = NULL
WHERE account_type = 'rights_holder'
  AND (
    -- These are likely artist accounts that were incorrectly converted
    (first_name IS NOT NULL AND last_name IS NOT NULL AND company_name IS NULL)
    OR 
    (artist_number IS NOT NULL)
    OR
    -- Check for typical artist patterns
    (email LIKE '%@gmail.com' AND company_name IS NULL AND rights_holder_type IS NULL)
  );

-- 3. Verify the fix
SELECT 
  'After fix - accounts that should be artists' as info,
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
  artist_number
FROM profiles 
WHERE account_type = 'artist_band'
ORDER BY created_at DESC;

-- 4. Show all rights holders to make sure legitimate ones weren't affected
SELECT 
  'Legitimate rights holders (should remain unchanged)' as info,
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

-- 5. Count by account type to verify the fix
SELECT 
  'Final account type distribution' as info,
  account_type,
  COUNT(*) as count
FROM profiles 
GROUP BY account_type
ORDER BY account_type;
