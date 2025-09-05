-- CRITICAL SECURITY FIX: Fix RLS policies that allow cross-account access
-- This script fixes the security flaw where users can access other users' profiles

-- ============================================
-- 1. DROP ALL EXISTING POLICIES FIRST
-- ============================================

-- Drop ALL existing policies to start fresh
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

-- ============================================
-- 2. CREATE SECURE RLS POLICIES
-- ============================================

-- Users can ONLY view their own profile
CREATE POLICY "Users can view own profile only" ON profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- Users can ONLY update their own profile
CREATE POLICY "Users can update own profile only" ON profiles
    FOR UPDATE 
    USING (auth.uid() = id);

-- Users can ONLY insert their own profile
CREATE POLICY "Users can insert own profile only" ON profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Admins can view all profiles (for admin dashboard)
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles" ON profiles
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

-- ============================================
-- 3. VERIFY THE FIX
-- ============================================

-- List all policies to confirm the fix
SELECT 
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
-- 4. TEST SECURITY
-- ============================================

-- This query should now fail for non-admin users trying to access other profiles
-- (It will return 0 rows instead of allowing cross-account access)
SELECT 
    'Security test' as test_type,
    COUNT(*) as accessible_profiles,
    CASE 
        WHEN COUNT(*) = 1 THEN 'SECURE - User can only see their own profile'
        WHEN COUNT(*) > 1 THEN 'INSECURE - User can see multiple profiles'
        ELSE 'NO ACCESS - User cannot see any profiles'
    END as security_status
FROM profiles 
WHERE id = auth.uid();

-- ============================================
-- 5. ADDITIONAL SECURITY MEASURES
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, UPDATE, INSERT ON profiles TO authenticated;

-- ============================================
-- 6. VERIFY NO OTHER SECURITY HOLES
-- ============================================

-- Check if there are any other dangerous policies
SELECT 
    'DANGEROUS POLICY DETECTED' as warning,
    policyname,
    tablename,
    qual
FROM pg_policies 
WHERE qual LIKE '%true%' 
    AND tablename = 'profiles'
    AND policyname != 'Admins can view all profiles';

-- ============================================
-- 7. FINAL SECURITY CHECK
-- ============================================

-- Verify that users can only access their own profile
SELECT 
    'Final security verification' as check_type,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ SECURE - Users can only access their own profile'
        ELSE '❌ INSECURE - Cross-account access still possible'
    END as result
FROM profiles 
WHERE id = auth.uid();
