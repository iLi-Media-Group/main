-- Find user information from auth.users table
-- This will help us get the correct user ID and email for creating the profile

SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email LIKE '%@%' 
ORDER BY created_at DESC 
LIMIT 10;

-- Also check if there are any users without profiles
SELECT 
  au.id,
  au.email,
  au.created_at,
  CASE WHEN p.id IS NULL THEN 'NO PROFILE' ELSE 'HAS PROFILE' END as profile_status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email LIKE '%@%'
ORDER BY au.created_at DESC;
