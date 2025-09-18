-- Fix Tracks Visibility for Clients
-- Re-enable RLS with proper policies that allow clients to see tracks

-- ============================================
-- 1. RE-ENABLE RLS ON TRACKS TABLE
-- ============================================

-- Re-enable RLS on tracks table
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. CREATE PROPER RLS POLICIES FOR TRACKS
-- ============================================

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Producers can insert own tracks" ON tracks;
DROP POLICY IF EXISTS "Producers can update own tracks" ON tracks;
DROP POLICY IF EXISTS "Producers can delete own tracks" ON tracks;
DROP POLICY IF EXISTS "Tracks are viewable by everyone" ON tracks;
DROP POLICY IF EXISTS "Public read access to tracks" ON tracks;
DROP POLICY IF EXISTS "Admins can manage all tracks" ON tracks;

-- SELECT: Allow everyone to view tracks (for catalog browsing)
-- This is the critical policy that allows clients to see tracks
CREATE POLICY "Tracks are viewable by everyone" ON tracks
  FOR SELECT
  USING (true);

-- INSERT: Allow producers and admins to insert tracks
CREATE POLICY "Producers can insert own tracks" ON tracks
  FOR INSERT
  WITH CHECK (
    auth.uid() = track_producer_id
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type IN ('producer', 'admin', 'admin,producer')
    )
  );

-- UPDATE: Allow track owners and admins to update tracks
CREATE POLICY "Producers can update own tracks" ON tracks
  FOR UPDATE
  USING (
    auth.uid() = track_producer_id
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = 'admin'
    )
  );

-- DELETE: Allow track owners and admins to delete tracks
CREATE POLICY "Producers can delete own tracks" ON tracks
  FOR DELETE
  USING (
    auth.uid() = track_producer_id
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = 'admin'
    )
  );

-- ============================================
-- 3. VERIFY THE FIX
-- ============================================

-- Check RLS status
SELECT 'RLS Status for tracks table:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as status
FROM pg_tables 
WHERE tablename = 'tracks';

-- Check all policies for tracks table
SELECT 'RLS Policies for tracks table:' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'tracks'
ORDER BY cmd, policyname;

-- Test that clients can see tracks
SELECT 'Testing track visibility:' as info;
SELECT COUNT(*) as total_tracks FROM tracks;

-- Test that non-sync-only tracks are visible (for clients)
SELECT 'Non-sync-only tracks count:' as info;
SELECT COUNT(*) as non_sync_tracks FROM tracks WHERE is_sync_only = FALSE OR is_sync_only IS NULL;

-- ============================================
-- 4. ADDITIONAL SECURITY FOR SYNC-ONLY TRACKS
-- ============================================

-- Update the get_visible_tracks function to ensure it works properly
CREATE OR REPLACE FUNCTION public.get_visible_tracks(user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  artist TEXT,
  genres TEXT,
  sub_genres TEXT,
  moods TEXT[],
  media_usage TEXT[],
  bpm INTEGER,
  key TEXT,
  has_sting_ending BOOLEAN,
  is_one_stop BOOLEAN,
  audio_url TEXT,
  image_url TEXT,
  mp3_url TEXT,
  trackouts_url TEXT,
  stems_url TEXT,
  split_sheet_url TEXT,
  has_vocals BOOLEAN,
  vocals_usage_type TEXT,
  is_sync_only BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.artist,
    t.genres,
    t.sub_genres,
    t.moods,
    t.media_usage,
    t.bpm,
    t.key,
    t.has_sting_ending,
    t.is_one_stop,
    t.audio_url,
    t.image_url,
    t.mp3_url,
    t.trackouts_url,
    t.stems_url,
    t.split_sheet_url,
    t.has_vocals,
    t.vocals_usage_type,
    t.is_sync_only,
    t.created_at,
    t.updated_at
  FROM tracks t
  WHERE 
    -- Show all tracks to producers (track owners)
    t.track_producer_id = user_id
    OR
    -- For clients, only show tracks that are not sync-only
    (t.is_sync_only = FALSE OR t.is_sync_only IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. FINAL VERIFICATION
-- ============================================

-- Verify that the function works correctly
SELECT 'Testing get_visible_tracks function:' as info;
SELECT COUNT(*) as visible_tracks FROM get_visible_tracks(auth.uid());

-- Show summary
SELECT 'Tracks visibility fix completed successfully!' as status;
