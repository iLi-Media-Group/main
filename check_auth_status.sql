-- Check Authentication Status
-- This will help us understand why auth.uid() is returning null

-- Check if we're in an authenticated context
SELECT 'Authentication Status Check:' as info;

-- Check auth.uid()
SELECT 
  'auth.uid()' as check_name,
  auth.uid() as value,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ NULL - Not authenticated'
    ELSE '✅ Authenticated'
  END as status;

-- Check auth.role()
SELECT 
  'auth.role()' as check_name,
  auth.role() as value,
  CASE 
    WHEN auth.role() IS NULL THEN '❌ NULL - No role'
    ELSE '✅ Has role: ' || auth.role()
  END as status;

-- Check if we can access the auth.users table
SELECT 'Checking auth.users access:' as info;
SELECT 
  'auth.users access' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN '✅ Can access auth.users'
    ELSE '❌ Cannot access auth.users'
  END as status;

-- Check if we can access the profiles table
SELECT 'Checking profiles table access:' as info;
SELECT 
  'profiles access' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN '✅ Can access profiles'
    ELSE '❌ Cannot access profiles'
  END as status;

-- Check current session
SELECT 'Checking current session:' as info;
SELECT 
  'session check' as check_name,
  CASE 
    WHEN current_setting('request.jwt.claims', true) IS NOT NULL THEN '✅ JWT claims available'
    ELSE '❌ No JWT claims'
  END as status;

-- Try to extract user ID from JWT claims
SELECT 'Extracting user ID from JWT:' as info;
SELECT 
  'JWT user ID' as check_name,
  current_setting('request.jwt.claims', true)::json->>'sub' as user_id_from_jwt,
  CASE 
    WHEN current_setting('request.jwt.claims', true)::json->>'sub' IS NOT NULL THEN '✅ Found user ID in JWT'
    ELSE '❌ No user ID in JWT'
  END as status;

-- Check if we can manually query the user profile using JWT
SELECT 'Manual profile lookup:' as info;
SELECT 
  'Manual lookup' as check_name,
  (SELECT account_type FROM profiles WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid) as account_type_from_jwt,
  CASE 
    WHEN (SELECT account_type FROM profiles WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid) IS NOT NULL THEN '✅ Found profile using JWT'
    ELSE '❌ No profile found using JWT'
  END as status;
