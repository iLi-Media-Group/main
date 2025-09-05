-- Populate stems_url column for existing tracks that have stems files in storage
-- This script checks for stems files in the 'stems' bucket and updates the tracks table

-- First, let's check what stems files exist in storage
-- Note: This requires access to the storage bucket, so we'll use a different approach

-- Method 1: Update tracks based on the expected path pattern
-- Stems are stored as: {user_id}/{track_title}/stems.zip

UPDATE tracks 
SET stems_url = CONCAT(track_producer_id, '/', REPLACE(title, ' ', '_'), '/stems.zip')
WHERE stems_url IS NULL 
  AND track_producer_id IS NOT NULL 
  AND title IS NOT NULL
  AND EXISTS (
    -- Check if the stems file exists in storage
    -- This is a placeholder - in practice, you'd need to check the actual storage bucket
    SELECT 1 FROM storage.objects 
    WHERE bucket_id = 'stems' 
    AND name = CONCAT(track_producer_id, '/', REPLACE(title, ' ', '_'), '/stems.zip')
  );

-- Method 2: Alternative approach - update based on track ID pattern
-- Some tracks might be stored with track ID instead of title
UPDATE tracks 
SET stems_url = CONCAT(track_producer_id, '/', id::text, '/stems.zip')
WHERE stems_url IS NULL 
  AND track_producer_id IS NOT NULL 
  AND id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM storage.objects 
    WHERE bucket_id = 'stems' 
    AND name = CONCAT(track_producer_id, '/', id::text, '/stems.zip')
  );

-- Method 3: Update tracks that have stems files but no stems_url
-- This checks for any stems files in the user's folder
UPDATE tracks 
SET stems_url = (
  SELECT CONCAT(track_producer_id, '/', name)
  FROM storage.objects 
  WHERE bucket_id = 'stems' 
  AND name LIKE CONCAT(track_producer_id, '/%stems.zip')
  LIMIT 1
)
WHERE stems_url IS NULL 
  AND track_producer_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM storage.objects 
    WHERE bucket_id = 'stems' 
    AND name LIKE CONCAT(track_producer_id, '/%stems.zip')
  );

-- Method 4: Manual update for specific tracks (if you know the exact paths)
-- Replace the paths with actual stems file paths from your storage
/*
UPDATE tracks 
SET stems_url = 'specific_stems_file_path_here'
WHERE id = 'specific_track_id';
*/

-- Check the results
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

-- Count tracks with stems
SELECT 
  COUNT(*) as total_tracks,
  COUNT(stems_url) as tracks_with_stems,
  COUNT(*) - COUNT(stems_url) as tracks_without_stems
FROM tracks; 