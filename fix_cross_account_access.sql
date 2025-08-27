-- FIX CROSS-ACCOUNT ACCESS: Remove the specific dangerous policies that allow access to other accounts
-- This will fix the authentication security breach

-- Remove the dangerous policies that allow cross-account access
DROP POLICY IF EXISTS "Allow public read access to profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can update profiles" ON profiles;

-- Verify the dangerous policies are removed
SELECT 
    'VERIFICATION - DANGEROUS POLICIES REMOVED' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS - All dangerous policies removed'
        ELSE '❌ FAILURE - Dangerous policies still exist: ' || COUNT(*) || ' found'
    END as result
FROM pg_policies 
WHERE tablename = 'profiles'
    AND qual = 'true';

-- Test that users can only access their own profile now
SELECT 
    'SECURITY TEST' as test_type,
    COUNT(*) as accessible_profiles,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ SECURE - User can only see their own profile'
        WHEN COUNT(*) > 1 THEN '❌ INSECURE - User can see multiple profiles'
        ELSE '❌ NO ACCESS - User cannot see any profiles'
    END as security_status
FROM profiles;
