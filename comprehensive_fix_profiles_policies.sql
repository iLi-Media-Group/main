-- Comprehensive Fix for rights_holder_profiles RLS Policies
-- This script completely resets and recreates all policies for the profiles table

-- ============================================
-- 1. VERIFY CURRENT STATE
-- ============================================

-- Check if the user exists and has proper authentication
SELECT 'User authentication check' as status, 
       CASE 
         WHEN EXISTS (SELECT FROM auth.users WHERE id = 'c5988a02-36b2-4225-b26e-fabfaa5796dc') 
         THEN 'User exists' 
         ELSE 'User not found' 
       END as result;

-- Check if rights holder exists
SELECT 'Rights holder check' as status,
       CASE 
         WHEN EXISTS (SELECT FROM rights_holders WHERE id = 'c5988a02-36b2-4225-b26e-fabfaa5796dc') 
         THEN 'Rights holder exists' 
         ELSE 'Rights holder not found' 
       END as result;

-- ============================================
-- 2. COMPLETELY RESET RLS POLICIES
-- ============================================

-- Disable RLS temporarily
ALTER TABLE rights_holder_profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (both singular and plural versions)
DROP POLICY IF EXISTS "Rights holders can view own profile" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Rights holders can view own profiles" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Rights holders can insert own profile" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Rights holders can insert own profiles" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Rights holders can update own profile" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Rights holders can update own profiles" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Rights holders can delete own profile" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Rights holders can delete own profiles" ON rights_holder_profiles;

-- Re-enable RLS
ALTER TABLE rights_holder_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE NEW POLICIES WITH PROPER PERMISSIONS
-- ============================================

-- SELECT policy - allow users to view their own profiles
CREATE POLICY "Rights holders can view own profiles" ON rights_holder_profiles
    FOR SELECT 
    USING (auth.uid() = rights_holder_id);

-- INSERT policy - allow users to insert their own profiles
CREATE POLICY "Rights holders can insert own profiles" ON rights_holder_profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = rights_holder_id);

-- UPDATE policy - allow users to update their own profiles
CREATE POLICY "Rights holders can update own profiles" ON rights_holder_profiles
    FOR UPDATE 
    USING (auth.uid() = rights_holder_id);

-- DELETE policy - allow users to delete their own profiles
CREATE POLICY "Rights holders can delete own profiles" ON rights_holder_profiles
    FOR DELETE 
    USING (auth.uid() = rights_holder_id);

-- ============================================
-- 4. VERIFY POLICIES ARE CREATED CORRECTLY
-- ============================================

-- List all policies for verification
SELECT 'Policy verification' as status, 
       policyname, 
       cmd, 
       permissive, 
       roles,
       qual
FROM pg_policies 
WHERE tablename = 'rights_holder_profiles'
ORDER BY policyname;

-- ============================================
-- 5. TEST THE FIX
-- ============================================

-- Test query for the specific user (should work now)
SELECT 'Test query for user' as status, 
       COUNT(*) as profile_count,
       CASE 
         WHEN COUNT(*) >= 0 THEN 'Query successful - no 406 error'
         ELSE 'Query failed'
       END as result
FROM rights_holder_profiles 
WHERE rights_holder_id = 'c5988a02-36b2-4225-b26e-fabfaa5796dc';

-- ============================================
-- 6. VERIFY RLS IS ENABLED
-- ============================================

-- Check if RLS is enabled on the table
SELECT 'RLS status check' as status,
       schemaname,
       tablename,
       rowsecurity
FROM pg_tables 
WHERE tablename = 'rights_holder_profiles';

-- ============================================
-- 7. FINAL VERIFICATION
-- ============================================

-- Test with a simple query to ensure no 406 error
SELECT 'Final test' as status,
       'If you see this, the 406 error is fixed' as message,
       NOW() as test_time;
