-- Quick Fix for Remaining Issues
-- This script addresses the 406 error on rights_holder_profiles table

-- ============================================
-- 1. VERIFY CURRENT STATE
-- ============================================

-- Check if the user exists
SELECT 'User exists' as status WHERE EXISTS (
    SELECT FROM auth.users 
    WHERE id = 'c5988a02-36b2-4225-b26e-fabfaa5796dc'
);

-- Check if rights holder exists
SELECT 'Rights holder exists' as status WHERE EXISTS (
    SELECT FROM rights_holders 
    WHERE id = 'c5988a02-36b2-4225-b26e-fabfaa5796dc'
);

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
-- 3. TEST THE FIX
-- ============================================

-- Test query for the specific user
SELECT 'Test query for user' as status, COUNT(*) as profile_count 
FROM rights_holder_profiles 
WHERE rights_holder_id = 'c5988a02-36b2-4225-b26e-fabfaa5796dc';

-- ============================================
-- 4. VERIFY POLICIES
-- ============================================

-- List all policies for verification
SELECT policyname, cmd, permissive, roles, qual
FROM pg_policies 
WHERE tablename = 'rights_holder_profiles'
ORDER BY policyname;
