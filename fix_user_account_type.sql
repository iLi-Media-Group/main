-- Fix User Account Type for Track Uploads
-- The user needs to be a 'producer' to upload tracks

-- Check what account types exist in the system
SELECT DISTINCT account_type FROM profiles WHERE account_type IS NOT NULL;

-- Check current user's profile
SELECT 
  id,
  email,
  account_type,
  first_name,
  last_name,
  created_at
FROM profiles 
WHERE id = auth.uid();

-- Update the current user to be a producer
UPDATE profiles 
SET account_type = 'producer'
WHERE id = auth.uid();

-- Verify the update
SELECT 
  id,
  email,
  account_type,
  first_name,
  last_name
FROM profiles 
WHERE id = auth.uid();

-- Now test if the user can insert tracks
SELECT 
  'Current user can insert tracks' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type IN ('producer', 'admin', 'admin,producer')
    ) THEN 'YES - User is producer/admin'
    ELSE 'NO - User is not producer/admin'
  END as result; 