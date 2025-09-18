-- Proper RLS Fix for Tracks Table
-- This creates correct, permanent policies that work for both producers and rights holders

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
-- 2. CLEAN UP EXISTING POLICIES
-- ============================================

-- Drop all existing policies to start fresh
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
-- 3. CREATE PROPER RLS POLICIES
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- SELECT: Allow everyone to view tracks (for catalog browsing)
-- This is essential for clients to browse the catalog
CREATE POLICY "tracks_select_policy" ON tracks
  FOR SELECT
  USING (true);

-- INSERT: Allow authenticated users to insert tracks
-- This works for both producers and rights holders
-- The track_producer_id field will be set to the user's ID
CREATE POLICY "tracks_insert_policy" ON tracks
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL  -- User must be authenticated
    AND auth.uid() = track_producer_id  -- User must own the track
  );

-- UPDATE: Allow track owners to update their own tracks
CREATE POLICY "tracks_update_policy" ON tracks
  FOR UPDATE
  USING (
    auth.uid() = track_producer_id  -- User must own the track
  );

-- DELETE: Allow track owners to delete their own tracks
CREATE POLICY "tracks_delete_policy" ON tracks
  FOR DELETE
  USING (
    auth.uid() = track_producer_id  -- User must own the track
  );

-- ============================================
-- 4. VERIFY THE POLICIES
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

-- ============================================
-- 5. TEST THE POLICIES
-- ============================================

-- Test that tracks can be queried (SELECT policy)
SELECT 'Testing SELECT policy:' as info;
SELECT COUNT(*) as track_count FROM tracks;

-- Test that the current user can see their own tracks
SELECT 'Testing user-specific SELECT:' as info;
SELECT COUNT(*) as user_tracks_count 
FROM tracks 
WHERE track_producer_id = auth.uid();

-- ============================================
-- 6. CHECK FOR POTENTIAL ISSUES
-- ============================================

-- Check if there are any triggers that might interfere
SELECT 'Checking triggers on tracks table:' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'tracks';

-- Check if there are any constraints that might cause issues
SELECT 'Checking constraints on tracks table:' as info;
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'tracks'::regclass;

-- ============================================
-- 7. VERIFY TABLE STRUCTURE
-- ============================================

-- Check that all required columns exist
SELECT 'Verifying tracks table structure:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' 
ORDER BY ordinal_position;

-- ============================================
-- 8. SUMMARY
-- ============================================

SELECT 'Proper RLS fix completed. Tracks table should now work correctly.' as summary;
SELECT 'Policies created:' as info;
SELECT 
  cmd as operation,
  policyname as policy_name,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Everyone can view tracks'
    WHEN cmd = 'INSERT' THEN 'Authenticated users can insert their own tracks'
    WHEN cmd = 'UPDATE' THEN 'Track owners can update their own tracks'
    WHEN cmd = 'DELETE' THEN 'Track owners can delete their own tracks'
  END as description
FROM pg_policies 
WHERE tablename = 'tracks'
ORDER BY cmd;
