-- FIX CLIENT LOGIN: Allow client logins to work while maintaining security
-- The current policies are too restrictive and blocking client logins

-- Check what's happening with client logins
SELECT 
    'CLIENT LOGIN TEST' as info,
    COUNT(*) as accessible_profiles,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ CLIENT LOGIN WORKING'
        WHEN COUNT(*) > 1 THEN '❌ INSECURE - Multiple profiles accessible'
        ELSE '❌ CLIENT LOGIN BROKEN - No profiles accessible'
    END as login_status
FROM profiles;

-- Add a policy that allows users to view their own profile by email as well
-- This is needed for the authentication system to work properly
CREATE POLICY "Users can view own profile by email" ON profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        (auth.jwt() ->> 'email')::text = email
    );

-- Test client login again
SELECT 
    'CLIENT LOGIN TEST AFTER FIX' as info,
    COUNT(*) as accessible_profiles,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ CLIENT LOGIN WORKING'
        WHEN COUNT(*) > 1 THEN '❌ INSECURE - Multiple profiles accessible'
        ELSE '❌ CLIENT LOGIN STILL BROKEN'
    END as login_status
FROM profiles;
