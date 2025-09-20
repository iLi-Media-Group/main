-- INVESTIGATE SECURITY ISSUE: Find what's still allowing cross-account access
-- This script will help us identify the remaining security problems

-- ============================================
-- 1. CHECK CURRENT RLS POLICIES
-- ============================================

-- List all current policies on profiles table
SELECT 
    'Current policies on profiles table' as info,
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- ============================================
-- 2. CHECK RLS STATUS
-- ============================================

-- Check if RLS is enabled on profiles table
SELECT 
    'RLS status on profiles table' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- ============================================
-- 3. TEST CURRENT USER ACCESS
-- ============================================

-- Check what the current user can access
SELECT 
    'Current user access test' as info,
    auth.uid() as current_user_id,
    COUNT(*) as accessible_profiles,
    CASE 
        WHEN COUNT(*) = 1 THEN 'SECURE - User can only see their own profile'
        WHEN COUNT(*) > 1 THEN 'INSECURE - User can see multiple profiles'
        ELSE 'NO ACCESS - User cannot see any profiles'
    END as security_status
FROM profiles;

-- ============================================
-- 4. CHECK FOR DANGEROUS POLICIES
-- ============================================

-- Look for any policies that use 'true' (allows all access)
SELECT 
    'DANGEROUS POLICY DETECTED' as warning,
    policyname,
    tablename,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE qual LIKE '%true%' 
    AND tablename = 'profiles';

-- ============================================
-- 5. CHECK FOR POLICIES WITHOUT RESTRICTIONS
-- ============================================

-- Look for policies that don't have proper restrictions
SELECT 
    'POLICY WITHOUT RESTRICTIONS' as warning,
    policyname,
    tablename,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
    AND (qual IS NULL OR qual = '' OR qual = 'true')
    AND (with_check IS NULL OR with_check = '' OR with_check = 'true');

-- ============================================
-- 6. CHECK FOR ADMIN POLICIES THAT MIGHT BE TOO BROAD
-- ============================================

-- Check if admin policies are allowing too much access
SELECT 
    'ADMIN POLICY CHECK' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
    AND policyname LIKE '%admin%';

-- ============================================
-- 7. TEST SPECIFIC ACCESS PATTERNS
-- ============================================

-- Test if we can access profiles by ID
SELECT 
    'Testing access by ID' as test,
    id,
    email,
    account_type
FROM profiles 
WHERE id = auth.uid();

-- Test if we can access profiles by email
SELECT 
    'Testing access by email' as test,
    id,
    email,
    account_type
FROM profiles 
WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid());

-- ============================================
-- 8. CHECK FOR ANY BYPASS MECHANISMS
-- ============================================

-- Check if there are any functions or triggers that might bypass RLS
SELECT 
    'FUNCTIONS THAT MIGHT BYPASS RLS' as warning,
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE prosrc LIKE '%profiles%'
    AND prosrc LIKE '%SELECT%'
    AND prosrc NOT LIKE '%auth.uid%';

-- ============================================
-- 9. CHECK FOR VIEWS THAT MIGHT BYPASS RLS
-- ============================================

-- Check if there are any views on profiles that might bypass RLS
SELECT 
    'VIEWS ON PROFILES TABLE' as info,
    viewname,
    definition
FROM pg_views 
WHERE definition LIKE '%profiles%';

-- ============================================
-- 10. FINAL SECURITY ASSESSMENT
-- ============================================

-- Comprehensive security check
SELECT 
    'COMPREHENSIVE SECURITY ASSESSMENT' as assessment,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'profiles' 
            AND qual LIKE '%true%'
        ) THEN '❌ DANGEROUS POLICIES FOUND'
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'profiles' 
            AND rowsecurity = true
        ) THEN '❌ RLS NOT ENABLED'
        WHEN COUNT(*) > 1 THEN '❌ CROSS-ACCOUNT ACCESS POSSIBLE'
        WHEN COUNT(*) = 1 THEN '✅ SECURE - SINGLE PROFILE ACCESS'
        ELSE '❌ NO ACCESS - POTENTIAL ISSUE'
    END as security_status,
    COUNT(*) as accessible_profiles
FROM profiles;
