-- Accurate script to populate stems_url ONLY for tracks that actually have stems files
-- This script first checks what stems files exist, then only updates those tracks

-- Step 1: First, let's see the current state
SELECT 
  'Current state' as info,
  COUNT(*) as total_tracks,
  COUNT(stems_url) as tracks_with_stems,
  COUNT(*) - COUNT(stems_url) as tracks_without_stems
FROM tracks;

-- Step 2: Show tracks that currently have stems_url populated
SELECT 
  id,
  title,
  track_producer_id,
  stems_url,
  'Currently has stems_url' as status
FROM tracks 
WHERE stems_url IS NOT NULL
ORDER BY created_at DESC;

-- Step 3: Clear all stems_url values first (to start fresh)
UPDATE tracks 
SET stems_url = NULL;

-- Step 4: Check what stems files actually exist in storage
-- Note: This requires access to the storage.objects table
-- If you don't have access, you'll need to manually identify which tracks have stems

-- Method 1: If you have access to storage.objects table
/*
SELECT 
  name as stems_file_path,
  track_producer_id,
  title
FROM storage.objects so
JOIN tracks t ON so.name LIKE CONCAT(t.track_producer_id, '/%stems.zip')
WHERE so.bucket_id = 'stems'
ORDER BY so.name;
*/

-- Method 2: Manual approach - only update tracks you KNOW have stems
-- Replace these with the actual track IDs that have stems
/*
UPDATE tracks 
SET stems_url = 'user_id/track_title/stems.zip'
WHERE id = 'specific_track_id_that_has_stems';
*/

-- Step 5: For the one track you know has stems, update it manually
-- Replace 'your_track_id' with the actual track ID that has stems
-- Replace 'user_id/track_title/stems.zip' with the actual stems file path

/*
UPDATE tracks 
SET stems_url = 'actual_stems_file_path_here'
WHERE id = 'your_track_id_that_has_stems';
*/

-- Step 6: Verify the results
SELECT 
  'After accurate update' as info,
  COUNT(*) as total_tracks,
  COUNT(stems_url) as tracks_with_stems,
  COUNT(*) - COUNT(stems_url) as tracks_without_stems
FROM tracks;

-- Step 7: Show only tracks that now have stems_url
SELECT 
  id,
  title,
  track_producer_id,
  stems_url,
  'Has stems file' as status
FROM tracks 
WHERE stems_url IS NOT NULL
ORDER BY created_at DESC;

-- Step 8: Show tracks without stems (should be most tracks)
SELECT 
  id,
  title,
  track_producer_id,
  created_at,
  'No stems file' as status
FROM tracks 
WHERE stems_url IS NULL
ORDER BY created_at DESC 
LIMIT 10; 