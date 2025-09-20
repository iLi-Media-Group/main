-- Script to restore stems_url for the track that actually has stems
-- This will help identify and fix the track that should have stems

-- Step 1: Show all tracks to help identify which one has stems
SELECT 
  id,
  title,
  track_producer_id,
  stems_url,
  created_at,
  'Need to identify which one has stems' as status
FROM tracks 
ORDER BY created_at DESC 
LIMIT 20;

-- Step 2: Show tracks by a specific producer (if you know which producer has stems)
-- Replace 'producer_user_id' with the actual producer ID
/*
SELECT 
  id,
  title,
  track_producer_id,
  stems_url,
  created_at
FROM tracks 
WHERE track_producer_id = 'producer_user_id'
ORDER BY created_at DESC;
*/

-- Step 3: Once you identify the correct track, uncomment and modify this:
-- Replace 'correct_track_id' with the actual track ID that has stems
-- Replace 'user_id/track_title/stems.zip' with the actual stems file path

/*
UPDATE tracks 
SET stems_url = 'user_id/track_title/stems.zip'
WHERE id = 'correct_track_id';
*/

-- Step 4: Verify the fix
SELECT 
  'After restore' as info,
  COUNT(*) as total_tracks,
  COUNT(stems_url) as tracks_with_stems,
  COUNT(*) - COUNT(stems_url) as tracks_without_stems
FROM tracks;

-- Step 5: Show the track that now has stems
SELECT 
  id,
  title,
  track_producer_id,
  stems_url,
  '✅ Has stems' as status
FROM tracks 
WHERE stems_url IS NOT NULL
ORDER BY created_at DESC;

-- Step 6: Show tracks without stems (should be all except 1)
SELECT 
  id,
  title,
  track_producer_id,
  created_at,
  '❌ No stems' as status
FROM tracks 
WHERE stems_url IS NULL
ORDER BY created_at DESC 
LIMIT 10; 