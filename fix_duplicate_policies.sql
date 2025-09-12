-- Fix Duplicate RLS Policies for rights_holder_profiles
-- This script removes duplicate policies and creates clean ones

-- ============================================
-- 1. DROP ALL EXISTING POLICIES
-- ============================================

-- Drop all policies for rights_holder_profiles (both singular and plural versions)
DROP POLICY IF EXISTS "Rights holders can view own profile" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Rights holders can view own profiles" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Rights holders can insert own profile" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Rights holders can insert own profiles" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Rights holders can update own profile" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Rights holders can update own profiles" ON rights_holder_profiles;

-- ============================================
-- 2. VERIFY RLS IS ENABLED
-- ============================================

ALTER TABLE rights_holder_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE CLEAN POLICIES
-- ============================================

-- Create SELECT policy
CREATE POLICY "Rights holders can view own profiles" ON rights_holder_profiles
    FOR SELECT USING (auth.uid() = rights_holder_id);

-- Create INSERT policy
CREATE POLICY "Rights holders can insert own profiles" ON rights_holder_profiles
    FOR INSERT WITH CHECK (auth.uid() = rights_holder_id);

-- Create UPDATE policy
CREATE POLICY "Rights holders can update own profiles" ON rights_holder_profiles
    FOR UPDATE USING (auth.uid() = rights_holder_id);

-- ============================================
-- 4. VERIFY THE FIX
-- ============================================

-- List all policies to confirm cleanup
SELECT policyname, cmd, permissive, roles, qual
FROM pg_policies 
WHERE tablename = 'rights_holder_profiles'
ORDER BY policyname;

-- Test query for the specific user
SELECT 'Test query for user' as status, COUNT(*) as profile_count 
FROM rights_holder_profiles 
WHERE rights_holder_id = 'c5988a02-36b2-4225-b26e-fabfaa5796dc';
