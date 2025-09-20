-- Check if user has proper producer profile for track upload
-- This will help identify if the track_producer_id issue is causing the 400 error

-- Check if the user exists in profiles table
SELECT 'Checking user profile...' as info;

SELECT 
  id,
  email,
  account_type,
  producer_number,
  created_at
FROM profiles 
WHERE id = '83e21f94-aced-452a-bafb-6eb9629e3b18';

-- Check if user has producer account type
SELECT 'Checking account type...' as info;

SELECT 
  id,
  account_type,
  CASE 
    WHEN account_type LIKE '%producer%' THEN 'Has producer access'
    ELSE 'No producer access'
  END as producer_status
FROM profiles 
WHERE id = '83e21f94-aced-452a-bafb-6eb9629e3b18';

-- Check if user has existing tracks (to verify track_producer_id relationship)
SELECT 'Checking existing tracks...' as info;

SELECT 
  id,
  title,
  track_producer_id,
  created_at
FROM tracks 
WHERE track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
ORDER BY created_at DESC
LIMIT 5;
