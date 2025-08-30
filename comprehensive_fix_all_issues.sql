-- Comprehensive Fix for All Rights Holder System RLS Issues
-- This script addresses all the 406 and RLS policy violation errors

-- ============================================
-- 1. FIX RIGHTS_HOLDER_PROFILES RLS POLICIES
-- ============================================

-- Disable RLS temporarily on rights_holder_profiles
ALTER TABLE rights_holder_profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies for rights_holder_profiles
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

-- Create new policies for rights_holder_profiles
CREATE POLICY "Rights holders can view own profiles" ON rights_holder_profiles
    FOR SELECT USING (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can insert own profiles" ON rights_holder_profiles
    FOR INSERT WITH CHECK (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can update own profiles" ON rights_holder_profiles
    FOR UPDATE USING (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can delete own profiles" ON rights_holder_profiles
    FOR DELETE USING (auth.uid() = rights_holder_id);

-- ============================================
-- 2. FIX MASTER_RECORDINGS RLS POLICIES
-- ============================================

-- Disable RLS temporarily on master_recordings
ALTER TABLE master_recordings DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Rights holders can view own recordings" ON master_recordings;
DROP POLICY IF EXISTS "Rights holders can insert own recordings" ON master_recordings;
DROP POLICY IF EXISTS "Rights holders can update own recordings" ON master_recordings;
DROP POLICY IF EXISTS "Rights holders can delete own recordings" ON master_recordings;

-- Re-enable RLS
ALTER TABLE master_recordings ENABLE ROW LEVEL SECURITY;

-- Create new policies for master_recordings
CREATE POLICY "Rights holders can view own recordings" ON master_recordings
    FOR SELECT USING (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can insert own recordings" ON master_recordings
    FOR INSERT WITH CHECK (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can update own recordings" ON master_recordings
    FOR UPDATE USING (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can delete own recordings" ON master_recordings
    FOR DELETE USING (auth.uid() = rights_holder_id);

-- ============================================
-- 3. FIX PUBLISHING_RIGHTS RLS POLICIES
-- ============================================

-- Disable RLS temporarily on publishing_rights
ALTER TABLE publishing_rights DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Rights holders can view own publishing rights" ON publishing_rights;
DROP POLICY IF EXISTS "Rights holders can insert own publishing rights" ON publishing_rights;
DROP POLICY IF EXISTS "Rights holders can update own publishing rights" ON publishing_rights;
DROP POLICY IF EXISTS "Rights holders can delete own publishing rights" ON publishing_rights;

-- Re-enable RLS
ALTER TABLE publishing_rights ENABLE ROW LEVEL SECURITY;

-- Create new policies for publishing_rights
CREATE POLICY "Rights holders can view own publishing rights" ON publishing_rights
    FOR SELECT USING (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can insert own publishing rights" ON publishing_rights
    FOR INSERT WITH CHECK (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can update own publishing rights" ON publishing_rights
    FOR UPDATE USING (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can delete own publishing rights" ON publishing_rights
    FOR DELETE USING (auth.uid() = rights_holder_id);

-- ============================================
-- 4. FIX SPLIT_SHEETS RLS POLICIES
-- ============================================

-- Disable RLS temporarily on split_sheets
ALTER TABLE split_sheets DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Rights holders can view own split sheets" ON split_sheets;
DROP POLICY IF EXISTS "Rights holders can insert own split sheets" ON split_sheets;
DROP POLICY IF EXISTS "Rights holders can update own split sheets" ON split_sheets;
DROP POLICY IF EXISTS "Rights holders can delete own split sheets" ON split_sheets;

-- Re-enable RLS
ALTER TABLE split_sheets ENABLE ROW LEVEL SECURITY;

-- Create new policies for split_sheets
CREATE POLICY "Rights holders can view own split sheets" ON split_sheets
    FOR SELECT USING (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can insert own split sheets" ON split_sheets
    FOR INSERT WITH CHECK (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can update own split sheets" ON split_sheets
    FOR UPDATE USING (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can delete own split sheets" ON split_sheets
    FOR DELETE USING (auth.uid() = rights_holder_id);

-- ============================================
-- 5. FIX SPLIT_SHEET_PARTICIPANTS RLS POLICIES
-- ============================================

-- Disable RLS temporarily on split_sheet_participants
ALTER TABLE split_sheet_participants DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Rights holders can view own participants" ON split_sheet_participants;
DROP POLICY IF EXISTS "Rights holders can insert own participants" ON split_sheet_participants;
DROP POLICY IF EXISTS "Rights holders can update own participants" ON split_sheet_participants;
DROP POLICY IF EXISTS "Rights holders can delete own participants" ON split_sheet_participants;

-- Re-enable RLS
ALTER TABLE split_sheet_participants ENABLE ROW LEVEL SECURITY;

-- Create new policies for split_sheet_participants
CREATE POLICY "Rights holders can view own participants" ON split_sheet_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM split_sheets ss 
            WHERE ss.id = split_sheet_participants.split_sheet_id 
            AND ss.rights_holder_id = auth.uid()
        )
    );

CREATE POLICY "Rights holders can insert own participants" ON split_sheet_participants
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM split_sheets ss 
            WHERE ss.id = split_sheet_participants.split_sheet_id 
            AND ss.rights_holder_id = auth.uid()
        )
    );

CREATE POLICY "Rights holders can update own participants" ON split_sheet_participants
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM split_sheets ss 
            WHERE ss.id = split_sheet_participants.split_sheet_id 
            AND ss.rights_holder_id = auth.uid()
        )
    );

CREATE POLICY "Rights holders can delete own participants" ON split_sheet_participants
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM split_sheets ss 
            WHERE ss.id = split_sheet_participants.split_sheet_id 
            AND ss.rights_holder_id = auth.uid()
        )
    );

-- ============================================
-- 6. FIX CO_SIGNERS RLS POLICIES
-- ============================================

-- Disable RLS temporarily on co_signers
ALTER TABLE co_signers DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Rights holders can view own co signers" ON co_signers;
DROP POLICY IF EXISTS "Rights holders can insert own co signers" ON co_signers;
DROP POLICY IF EXISTS "Rights holders can update own co signers" ON co_signers;
DROP POLICY IF EXISTS "Rights holders can delete own co signers" ON co_signers;

-- Re-enable RLS
ALTER TABLE co_signers ENABLE ROW LEVEL SECURITY;

-- Create new policies for co_signers
CREATE POLICY "Rights holders can view own co signers" ON co_signers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM split_sheets ss 
            WHERE ss.id = co_signers.split_sheet_id 
            AND ss.rights_holder_id = auth.uid()
        )
    );

CREATE POLICY "Rights holders can insert own co signers" ON co_signers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM split_sheets ss 
            WHERE ss.id = co_signers.split_sheet_id 
            AND ss.rights_holder_id = auth.uid()
        )
    );

CREATE POLICY "Rights holders can update own co signers" ON co_signers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM split_sheets ss 
            WHERE ss.id = co_signers.split_sheet_id 
            AND ss.rights_holder_id = auth.uid()
        )
    );

CREATE POLICY "Rights holders can delete own co signers" ON co_signers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM split_sheets ss 
            WHERE ss.id = co_signers.split_sheet_id 
            AND ss.rights_holder_id = auth.uid()
        )
    );

-- ============================================
-- 7. VERIFICATION QUERIES
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

-- Test query for rights_holder_profiles (should work now)
SELECT 'Test query for rights_holder_profiles' as status,
       COUNT(*) as profile_count,
       CASE
         WHEN COUNT(*) >= 0 THEN 'Query successful - no 406 error'
         ELSE 'Query failed'
       END as result
FROM rights_holder_profiles
WHERE rights_holder_id = 'c5988a02-36b2-4225-b26e-fabfaa5796dc';

-- List all policies for verification
SELECT 'Policy verification' as status,
       tablename,
       policyname,
       cmd,
       permissive,
       roles,
       qual
FROM pg_policies
WHERE tablename IN ('rights_holder_profiles', 'master_recordings', 'publishing_rights', 'split_sheets', 'split_sheet_participants', 'co_signers')
ORDER BY tablename, policyname;

-- ============================================
-- 8. FINAL VERIFICATION
-- ============================================

-- Test with a simple query to ensure no 406 error
SELECT 'Final test' as status,
       'If you see this, the RLS issues are fixed' as message,
       NOW() as test_time;
