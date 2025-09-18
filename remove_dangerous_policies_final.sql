-- REMOVE DANGEROUS POLICIES: Remove policies that are blocking client login
-- These policies might be preventing authentication from working

-- Remove the dangerous policies that allow cross-account access
DROP POLICY IF EXISTS "Allow public read access to profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can update profiles" ON profiles;

-- Test that client login works now
SELECT 
    'CLIENT LOGIN TEST' as info,
    COUNT(*) as accessible_profiles,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ CLIENT LOGIN SHOULD WORK'
        WHEN COUNT(*) > 1 THEN '❌ INSECURE - Multiple profiles accessible'
        ELSE '❌ CLIENT LOGIN STILL BROKEN'
    END as login_status
FROM profiles;
