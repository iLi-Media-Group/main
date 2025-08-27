-- TEST AUTHENTICATED ACCESS: See what happens when a user is actually authenticated
-- This will show us the real authentication issue

-- Check if we're authenticated
SELECT 
    'AUTHENTICATION STATUS' as info,
    auth.uid() as current_user_id,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'AUTHENTICATED'
        ELSE 'NOT AUTHENTICATED'
    END as auth_status;

-- If authenticated, show what profiles we can access
SELECT 
    'PROFILES ACCESSIBLE WHEN AUTHENTICATED' as info,
    COUNT(*) as accessible_profiles
FROM profiles;

-- Show the actual profiles we can access (if any)
SELECT 
    id,
    email,
    account_type,
    first_name,
    last_name
FROM profiles 
LIMIT 5;
