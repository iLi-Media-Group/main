-- Simple automated script to populate stems_url for tracks with stems
-- NOTE: This script assumes stems files exist based on naming patterns
-- For accurate results, use populate_stems_url_automated.sql which checks the actual bucket

-- Step 1: Clear all stems_url values first (start fresh)
UPDATE tracks 
SET stems_url = NULL;

-- Step 2: Method 1 - Update based on track title pattern (most common)
-- This assumes stems are stored as: {user_id}/{track_title}/stems.zip
-- NOTE: This will populate for ALL tracks, not just those with actual stems files
UPDATE tracks 
SET stems_url = CONCAT(track_producer_id, '/', REPLACE(title, ' ', '_'), '/stems.zip')
WHERE track_producer_id IS NOT NULL 
  AND title IS NOT NULL
  AND title != '';

-- Step 3: Method 2 - Update based on track ID pattern
-- This assumes stems are stored as: {user_id}/{track_id}/stems.zip
UPDATE tracks 
SET stems_url = CONCAT(track_producer_id, '/', id::text, '/stems.zip')
WHERE stems_url IS NULL 
  AND track_producer_id IS NOT NULL 
  AND id IS NOT NULL;

-- Step 4: Method 3 - Update based on sanitized title
-- This handles special characters in track titles
UPDATE tracks 
SET stems_url = CONCAT(
  track_producer_id, '/', 
  REGEXP_REPLACE(
    LOWER(REPLACE(title, ' ', '_')), 
    '[^a-z0-9_]', '', 'g'
  ), 
  '/stems.zip'
)
WHERE stems_url IS NULL 
  AND track_producer_id IS NOT NULL 
  AND title IS NOT NULL
  AND title != '';

-- Step 5: Method 4 - Update based on UUID track IDs
UPDATE tracks 
SET stems_url = CONCAT(track_producer_id, '/', id, '/stems.zip')
WHERE stems_url IS NULL 
  AND track_producer_id IS NOT NULL 
  AND id IS NOT NULL
  AND id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 6: Show results
SELECT 
  'Final results' as info,
  COUNT(*) as total_tracks,
  COUNT(stems_url) as tracks_with_stems,
  COUNT(*) - COUNT(stems_url) as tracks_without_stems,
  ROUND((COUNT(stems_url)::numeric / COUNT(*) * 100), 2) as percentage_with_stems
FROM tracks;

-- Step 7: Show tracks that now have stems
SELECT 
  id,
  title,
  track_producer_id,
  stems_url,
  '✅ Assumed to have stems' as status
FROM tracks 
WHERE stems_url IS NOT NULL
ORDER BY created_at DESC;

-- Step 8: Show tracks without stems
SELECT 
  id,
  title,
  track_producer_id,
  created_at,
  '❌ No stems assumed' as status
FROM tracks 
WHERE stems_url IS NULL
ORDER BY created_at DESC 
LIMIT 10;

-- Step 9: Summary by producer
SELECT 
  track_producer_id,
  COUNT(*) as total_tracks,
  COUNT(stems_url) as tracks_with_stems,
  ROUND((COUNT(stems_url)::numeric / COUNT(*) * 100), 2) as percentage_with_stems
FROM tracks 
GROUP BY track_producer_id
ORDER BY total_tracks DESC
LIMIT 10; 