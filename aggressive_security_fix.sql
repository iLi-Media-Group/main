-- AGGRESSIVE SECURITY FIX: Remove ALL dangerous policies and ensure proper account isolation
-- This script will completely fix the cross-account access issue

-- ============================================
-- 1. DROP ALL EXISTING POLICIES (NUCLEAR OPTION)
-- ============================================

-- Drop ALL policies on profiles table - we'll rebuild from scratch
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile only" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile only" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON profiles;

-- Drop ANY other policies that might exist (catch-all)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON profiles';
    END LOOP;
END $$;

-- ============================================
-- 2. DISABLE RLS TEMPORARILY
-- ============================================

-- Disable RLS to ensure clean slate
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RE-ENABLE RLS
-- ============================================

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE ONLY SECURE POLICIES
-- ============================================

-- CRITICAL: Users can ONLY view their own profile
CREATE POLICY "secure_users_view_own_profile" ON profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- CRITICAL: Users can ONLY update their own profile
CREATE POLICY "secure_users_update_own_profile" ON profiles
    FOR UPDATE 
    USING (auth.uid() = id);

-- CRITICAL: Users can ONLY insert their own profile
CREATE POLICY "secure_users_insert_own_profile" ON profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- CRITICAL: Users can ONLY delete their own profile
CREATE POLICY "secure_users_delete_own_profile" ON profiles
    FOR DELETE 
    USING (auth.uid() = id);

-- ============================================
-- 5. VERIFY NO DANGEROUS POLICIES EXIST
-- ============================================

-- Check for any remaining dangerous policies
SELECT 
    'DANGEROUS POLICY CHECK' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ NO DANGEROUS POLICIES FOUND'
        ELSE '❌ DANGEROUS POLICIES STILL EXIST: ' || COUNT(*) || ' found'
    END as result
FROM pg_policies 
WHERE tablename = 'profiles'
    AND (qual LIKE '%true%' OR qual IS NULL OR qual = '');

-- ============================================
-- 6. TEST SECURITY IMMEDIATELY
-- ============================================

-- Test that users can only access their own profile
SELECT 
    'SECURITY TEST' as test_type,
    auth.uid() as current_user_id,
    COUNT(*) as accessible_profiles,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ SECURE - User can only see their own profile'
        WHEN COUNT(*) > 1 THEN '❌ INSECURE - User can see multiple profiles'
        ELSE '❌ NO ACCESS - User cannot see any profiles'
    END as security_status
FROM profiles;

-- ============================================
-- 7. VERIFY RLS IS ENABLED
-- ============================================

-- Ensure RLS is properly enabled
SELECT 
    'RLS STATUS' as check_type,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE tablename = 'profiles';

-- ============================================
-- 8. FINAL SECURITY VERIFICATION
-- ============================================

-- Comprehensive final check
SELECT 
    'FINAL SECURITY VERIFICATION' as verification,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'profiles' 
            AND qual LIKE '%true%'
        ) THEN '❌ CRITICAL FAILURE - Dangerous policies still exist'
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'profiles' 
            AND rowsecurity = true
        ) THEN '❌ CRITICAL FAILURE - RLS not enabled'
        WHEN COUNT(*) > 1 THEN '❌ CRITICAL FAILURE - Cross-account access still possible'
        WHEN COUNT(*) = 1 THEN '✅ SUCCESS - Users can only access their own profile'
        ELSE '❌ CRITICAL FAILURE - No access at all'
    END as final_status,
    COUNT(*) as accessible_profiles
FROM profiles;

-- ============================================
-- 9. LIST ALL POLICIES FOR VERIFICATION
-- ============================================

-- Show all policies to confirm they are secure
SELECT 
    'POLICY VERIFICATION' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;
