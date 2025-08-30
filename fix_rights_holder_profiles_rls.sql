-- Fix Rights Holder Profiles RLS Policies
-- This script specifically addresses the 406 error on rights_holder_profiles table

-- ============================================
-- 1. CHECK CURRENT STATE
-- ============================================

-- Check if rights_holder_profiles table exists and has data
SELECT 'rights_holder_profiles table status' as check_type, 
       COUNT(*) as record_count 
FROM rights_holder_profiles;

-- Check current RLS status
SELECT 'RLS status for rights_holder_profiles' as check_type,
       rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'rights_holder_profiles';

-- ============================================
-- 2. FIX RLS POLICIES FOR PROFILES TABLE
-- ============================================

-- Drop all existing policies for rights_holder_profiles
DROP POLICY IF EXISTS "Rights holders can view own profile" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Rights holders can insert own profile" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Rights holders can update own profile" ON rights_holder_profiles;

-- Ensure RLS is enabled
ALTER TABLE rights_holder_profiles ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper permissions
CREATE POLICY "Rights holders can view own profile" ON rights_holder_profiles
    FOR SELECT USING (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can insert own profile" ON rights_holder_profiles
    FOR INSERT WITH CHECK (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can update own profile" ON rights_holder_profiles
    FOR UPDATE USING (auth.uid() = rights_holder_id);

-- ============================================
-- 3. VERIFY THE FIX
-- ============================================

-- Verify RLS is enabled
SELECT 'RLS enabled on rights_holder_profiles' as status WHERE EXISTS (
    SELECT FROM pg_tables 
    WHERE tablename = 'rights_holder_profiles' 
    AND rowsecurity = true
);

-- Verify policies exist
SELECT 'Policies created for rights_holder_profiles' as status WHERE EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'rights_holder_profiles' 
    AND policyname = 'Rights holders can view own profile'
);

-- List all policies for verification
SELECT policyname, cmd, permissive, roles, qual
FROM pg_policies 
WHERE tablename = 'rights_holder_profiles'
ORDER BY policyname;

-- Test basic query (this should work now)
SELECT 'Test query successful' as status, COUNT(*) as total_profiles FROM rights_holder_profiles;
