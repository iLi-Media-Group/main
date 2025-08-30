-- Fix 400 Error on Tracks Table
-- This script will temporarily disable RLS to allow uploads, then re-enable with proper policies

-- ============================================
-- 1. CHECK CURRENT STATUS
-- ============================================

-- Check current RLS status
SELECT 'Current RLS status on tracks table:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'tracks';

-- Check current policies
SELECT 'Current RLS policies on tracks table:' as info;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tracks'
ORDER BY policyname;

-- ============================================
-- 2. TEMPORARILY DISABLE RLS
-- ============================================

-- Disable RLS to allow uploads to work
ALTER TABLE tracks DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 'RLS status after disabling:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'tracks';

-- ============================================
-- 3. TEST BASIC QUERY
-- ============================================

-- Test that we can query tracks now
SELECT 'Testing tracks query after RLS disable:' as info;
SELECT COUNT(*) as track_count FROM tracks;

-- ============================================
-- 4. RE-ENABLE RLS WITH PROPER POLICIES
-- ============================================

-- Re-enable RLS
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Producers can insert own tracks" ON tracks;
DROP POLICY IF EXISTS "Producers can update own tracks" ON tracks;
DROP POLICY IF EXISTS "Producers can delete own tracks" ON tracks;
DROP POLICY IF EXISTS "Tracks are viewable by everyone" ON tracks;
DROP POLICY IF EXISTS "Public read access to tracks" ON tracks;
DROP POLICY IF EXISTS "Admins can manage all tracks" ON tracks;

-- Create simple, working policies
-- SELECT: Allow everyone to view tracks (for catalog browsing)
CREATE POLICY "Tracks are viewable by everyone" ON tracks
  FOR SELECT
  USING (true);

-- INSERT: Allow authenticated users to insert tracks (simplified for now)
CREATE POLICY "Producers can insert own tracks" ON tracks
  FOR INSERT
  WITH CHECK (
    auth.uid() = track_producer_id
  );

-- UPDATE: Allow track owners to update tracks
CREATE POLICY "Producers can update own tracks" ON tracks
  FOR UPDATE
  USING (
    auth.uid() = track_producer_id
  );

-- DELETE: Allow track owners to delete tracks
CREATE POLICY "Producers can delete own tracks" ON tracks
  FOR DELETE
  USING (
    auth.uid() = track_producer_id
  );

-- ============================================
-- 5. VERIFY THE FIX
-- ============================================

-- Check final RLS status
SELECT 'Final RLS status on tracks table:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'tracks';

-- Check final policies
SELECT 'Final RLS policies on tracks table:' as info;
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tracks'
ORDER BY policyname;

-- Test that tracks can still be queried
SELECT 'Testing tracks query after RLS fix:' as info;
SELECT COUNT(*) as track_count FROM tracks;

-- ============================================
-- 6. ADDITIONAL DEBUGGING
-- ============================================

-- Check if there are any constraints that might cause issues
SELECT 'Checking constraints on tracks table:' as info;
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'tracks'::regclass;

-- Check if there are any triggers that might interfere
SELECT 'Checking triggers on tracks table:' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'tracks';

-- ============================================
-- 7. SUMMARY
-- ============================================

SELECT 'RLS fix completed. Tracks table should now be accessible.' as summary;
