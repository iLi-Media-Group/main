-- Fix conflicting RLS policies on tracks table
-- First, disable RLS to clear all policies
ALTER TABLE tracks DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS tracks_delete_policy ON tracks;
DROP POLICY IF EXISTS tracks_insert_policy ON tracks;
DROP POLICY IF EXISTS tracks_select_policy ON tracks;
DROP POLICY IF EXISTS tracks_update_policy ON tracks;

-- Re-enable RLS
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Create clean, simple policies
-- SELECT: Everyone can view tracks (no restrictions)
CREATE POLICY "tracks_select_policy" ON tracks
FOR SELECT USING (true);

-- INSERT: Producers can insert their own tracks
CREATE POLICY "tracks_insert_policy" ON tracks
FOR INSERT WITH CHECK (
  auth.uid() = track_producer_id
);

-- UPDATE: Producers can update their own tracks
CREATE POLICY "tracks_update_policy" ON tracks
FOR UPDATE USING (
  auth.uid() = track_producer_id
);

-- DELETE: Producers can delete their own tracks
CREATE POLICY "tracks_delete_policy" ON tracks
FOR DELETE USING (
  auth.uid() = track_producer_id
);

-- Verify the policies are set correctly
SELECT 'Current RLS policies on tracks:' as info;
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

-- Test that tracks can be queried
SELECT 'Testing tracks query after RLS fix:' as info;
SELECT COUNT(*) as track_count FROM tracks; 