-- Test Supabase connection and configuration
-- This will help verify if the configuration issue is resolved

-- Test basic connection
SELECT current_database(), current_user, version();

-- Test if we can access the tracks table
SELECT COUNT(*) as track_count FROM tracks LIMIT 1;

-- Test if we can access the profiles table
SELECT COUNT(*) as profile_count FROM profiles LIMIT 1;

-- Check if the user can access their own profile
-- (This should work if RLS is configured correctly)
SELECT id, email, account_type 
FROM profiles 
WHERE id = '83e21f94-aced-452a-bafb-6eb9629e3b18' 
LIMIT 1;

-- Test if we can insert a simple record (this will fail if RLS blocks it)
-- We'll just test the connection, not actually insert
SELECT 'Connection test successful' as status;
