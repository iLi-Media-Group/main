-- Check Unified Auth User ID
-- This script helps us understand how to get the correct user ID for RLS policies

-- First, let's check if we can access the profiles table directly
SELECT 'Checking profiles table access:' as info;
SELECT 
  'profiles access' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN '✅ Can access profiles'
    ELSE '❌ Cannot access profiles'
  END as status;

-- Let's look at some recent profiles to understand the structure
SELECT 'Recent profiles in the system:' as info;
SELECT 
  id,
  email,
  account_type,
  created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if there are any users with admin,producer account type
SELECT 'Users with admin,producer account type:' as info;
SELECT 
  id,
  email,
  account_type,
  created_at
FROM profiles 
WHERE account_type LIKE '%admin%' AND account_type LIKE '%producer%'
ORDER BY created_at DESC;

-- Check all distinct account types in the system
SELECT 'All account types in the system:' as info;
SELECT DISTINCT account_type FROM profiles WHERE account_type IS NOT NULL ORDER BY account_type;

-- Check if we can query tracks table
SELECT 'Checking tracks table access:' as info;
SELECT 
  'tracks access' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM tracks LIMIT 1) THEN '✅ Can access tracks'
    ELSE '❌ Cannot access tracks'
  END as status;

-- Check recent tracks to see the structure
SELECT 'Recent tracks in the system:' as info;
SELECT 
  id,
  title,
  track_producer_id,
  created_at
FROM tracks 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if there are any tracks for users with admin,producer account type
SELECT 'Tracks for admin,producer users:' as info;
SELECT 
  t.id,
  t.title,
  t.track_producer_id,
  p.email,
  p.account_type
FROM tracks t
JOIN profiles p ON t.track_producer_id = p.id
WHERE p.account_type LIKE '%admin%' AND p.account_type LIKE '%producer%'
ORDER BY t.created_at DESC;
