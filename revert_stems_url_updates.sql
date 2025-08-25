-- Script to revert incorrect stems_url updates
-- This will clear stems_url for all tracks except the one that actually has stems

-- Step 1: First, let's see what we currently have
SELECT 
  'Current state' as info,
  COUNT(*) as total_tracks,
  COUNT(stems_url) as tracks_with_stems,
  COUNT(*) - COUNT(stems_url) as tracks_without_stems
FROM tracks;

-- Step 2: Show all tracks that currently have stems_url populated
SELECT 
  id,
  title,
  track_producer_id,
  stems_url,
  created_at
FROM tracks 
WHERE stems_url IS NOT NULL
ORDER BY created_at DESC;

-- Step 3: Clear ALL stems_url values (reset to NULL)
UPDATE tracks 
SET stems_url = NULL;

-- Step 4: Now manually add stems_url ONLY for the track that actually has stems
-- Replace 'your_actual_track_id' with the real track ID that has stems
-- Replace 'actual_stems_file_path' with the real stems file path

/*
UPDATE tracks 
SET stems_url = 'actual_stems_file_path'
WHERE id = 'your_actual_track_id';
*/

-- Step 5: Verify the results
SELECT 
  'After revert' as info,
  COUNT(*) as total_tracks,
  COUNT(stems_url) as tracks_with_stems,
  COUNT(*) - COUNT(stems_url) as tracks_without_stems
FROM tracks;

-- Step 6: Show the final state
SELECT 
  id,
  title,
  track_producer_id,
  stems_url,
  CASE 
    WHEN stems_url IS NOT NULL THEN '✅ Has stems'
    ELSE '❌ No stems'
  END as stems_status
FROM tracks 
ORDER BY created_at DESC 
LIMIT 20; 