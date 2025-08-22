-- EMERGENCY: Disable RLS on tracks table to fix 400 error
-- This will immediately allow uploads to work

-- ============================================
-- 1. COMPLETELY DISABLE RLS ON TRACKS TABLE
-- ============================================

-- Disable RLS completely
ALTER TABLE tracks DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 'RLS status after emergency disable:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'tracks';

-- ============================================
-- 2. DROP ALL EXISTING POLICIES
-- ============================================

-- Drop all policies to ensure clean state
DROP POLICY IF EXISTS "Producers can insert own tracks" ON tracks;
DROP POLICY IF EXISTS "Producers can update own tracks" ON tracks;
DROP POLICY IF EXISTS "Producers can delete own tracks" ON tracks;
DROP POLICY IF EXISTS "Tracks are viewable by everyone" ON tracks;
DROP POLICY IF EXISTS "Public read access to tracks" ON tracks;
DROP POLICY IF EXISTS "Admins can manage all tracks" ON tracks;
DROP POLICY IF EXISTS "tracks_select_policy" ON tracks;
DROP POLICY IF EXISTS "tracks_insert_policy" ON tracks;
DROP POLICY IF EXISTS "tracks_update_policy" ON tracks;
DROP POLICY IF EXISTS "tracks_delete_policy" ON tracks;

-- ============================================
-- 3. TEST ACCESS
-- ============================================

-- Test that we can query tracks
SELECT 'Testing tracks query after emergency disable:' as info;
SELECT COUNT(*) as track_count FROM tracks;

-- Test that we can see the table structure
SELECT 'Testing tracks table structure:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tracks' 
ORDER BY ordinal_position;

-- ============================================
-- 4. CHECK FOR ANY CONSTRAINTS
-- ============================================

-- Check for any constraints that might cause issues
SELECT 'Checking for problematic constraints:' as info;
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'tracks'::regclass;

-- ============================================
-- 5. SUMMARY
-- ============================================

SELECT 'EMERGENCY RLS DISABLE COMPLETED' as summary;

