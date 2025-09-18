-- Automated script to populate stems_url ONLY for tracks that have stems files in the stems bucket
-- This script checks the actual storage bucket and only updates tracks with existing stems files

-- Step 1: Clear all stems_url values first (start fresh)
UPDATE tracks 
SET stems_url = NULL;

-- Step 2: Check what stems files actually exist in the stems bucket
-- This query finds all stems files in the 'stems' bucket
WITH stems_files AS (
  SELECT 
    name as file_path,
    -- Extract user_id from path (assumes format: user_id/track_title/stems.zip)
    SPLIT_PART(name, '/', 1) as user_id,
    -- Extract track title from path
    SPLIT_PART(SPLIT_PART(name, '/', 2), '/', 1) as track_title_from_path
  FROM storage.objects 
  WHERE bucket_id = 'stems' 
  AND name LIKE '%stems.zip'
)
-- Step 3: Update tracks that have matching stems files in the bucket
UPDATE tracks 
SET stems_url = sf.file_path
FROM stems_files sf
WHERE tracks.track_producer_id::text = sf.user_id
  AND (
    -- Match by track title (with spaces replaced by underscores)
    sf.track_title_from_path = REPLACE(tracks.title, ' ', '_')
    OR 
    -- Match by track ID
    sf.track_title_from_path = tracks.id::text
    OR
    -- Match by sanitized track title
    sf.track_title_from_path = REGEXP_REPLACE(
      LOWER(REPLACE(tracks.title, ' ', '_')), 
      '[^a-z0-9_]', '', 'g'
    )
  );

-- Step 4: Alternative method - update based on any stems file in user's folder
-- This handles cases where the track title doesn't exactly match the file path
UPDATE tracks 
SET stems_url = (
  SELECT name 
  FROM storage.objects 
  WHERE bucket_id = 'stems' 
  AND name LIKE CONCAT(tracks.track_producer_id::text, '/%stems.zip')
  LIMIT 1
)
WHERE stems_url IS NULL 
  AND tracks.track_producer_id IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM storage.objects 
    WHERE bucket_id = 'stems' 
    AND name LIKE CONCAT(tracks.track_producer_id::text, '/%stems.zip')
  );

-- Step 5: Show results
SELECT 
  'Final results' as info,
  COUNT(*) as total_tracks,
  COUNT(stems_url) as tracks_with_stems,
  COUNT(*) - COUNT(stems_url) as tracks_without_stems,
  ROUND((COUNT(stems_url)::numeric / COUNT(*) * 100), 2) as percentage_with_stems
FROM tracks;

-- Step 6: Show tracks that now have stems (only tracks with actual stems files)
SELECT 
  id,
  title,
  track_producer_id,
  stems_url,
  '✅ Has stems file in bucket' as status
FROM tracks 
WHERE stems_url IS NOT NULL
ORDER BY created_at DESC;

-- Step 7: Show tracks without stems (tracks with no stems files in bucket)
SELECT 
  id,
  title,
  track_producer_id,
  created_at,
  '❌ No stems file in bucket' as status
FROM tracks 
WHERE stems_url IS NULL
ORDER BY created_at DESC 
LIMIT 10;

-- Step 8: Debug - show what stems files actually exist in the stems bucket
SELECT 
  'Stems files in stems bucket:' as info,
  name as file_path,
  SPLIT_PART(name, '/', 1) as user_id,
  SPLIT_PART(SPLIT_PART(name, '/', 2), '/', 1) as track_title_from_path
FROM storage.objects 
WHERE bucket_id = 'stems' 
AND name LIKE '%stems.zip'
ORDER BY name; 