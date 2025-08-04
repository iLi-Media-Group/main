-- Comprehensive script to populate stems_url for existing tracks
-- This script handles multiple storage patterns and provides debugging info

-- First, let's see what we're working with
SELECT 
  'Current tracks status' as info,
  COUNT(*) as total_tracks,
  COUNT(stems_url) as tracks_with_stems,
  COUNT(*) - COUNT(stems_url) as tracks_without_stems
FROM tracks;

-- Show sample tracks to understand the data structure
SELECT 
  id,
  title,
  track_producer_id,
  stems_url,
  created_at
FROM tracks 
ORDER BY created_at DESC 
LIMIT 10;

-- Method 1: Update based on track title pattern (most common)
-- Pattern: {user_id}/{track_title}/stems.zip
UPDATE tracks 
SET stems_url = CONCAT(track_producer_id, '/', REPLACE(title, ' ', '_'), '/stems.zip')
WHERE stems_url IS NULL 
  AND track_producer_id IS NOT NULL 
  AND title IS NOT NULL
  AND title != '';

-- Method 2: Update based on track ID pattern
-- Pattern: {user_id}/{track_id}/stems.zip
UPDATE tracks 
SET stems_url = CONCAT(track_producer_id, '/', id::text, '/stems.zip')
WHERE stems_url IS NULL 
  AND track_producer_id IS NOT NULL 
  AND id IS NOT NULL;

-- Method 3: Update based on sanitized title (handle special characters)
-- Pattern: {user_id}/{sanitized_title}/stems.zip
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

-- Method 4: Update based on track ID with UUID format
-- Pattern: {user_id}/{track_id}/stems.zip (for UUID track IDs)
UPDATE tracks 
SET stems_url = CONCAT(track_producer_id, '/', id, '/stems.zip')
WHERE stems_url IS NULL 
  AND track_producer_id IS NOT NULL 
  AND id IS NOT NULL
  AND id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Method 5: Manual updates for specific known tracks
-- Uncomment and modify these for tracks you know have stems
/*
UPDATE tracks 
SET stems_url = 'specific_user_id/specific_track_name/stems.zip'
WHERE id = 'known_track_id';

UPDATE tracks 
SET stems_url = 'another_user_id/another_track_name/stems.zip'
WHERE id = 'another_known_track_id';
*/

-- Check results after updates
SELECT 
  'After updates' as info,
  COUNT(*) as total_tracks,
  COUNT(stems_url) as tracks_with_stems,
  COUNT(*) - COUNT(stems_url) as tracks_without_stems,
  ROUND((COUNT(stems_url)::numeric / COUNT(*) * 100), 2) as percentage_with_stems
FROM tracks;

-- Show updated tracks
SELECT 
  id,
  title,
  track_producer_id,
  stems_url,
  CASE 
    WHEN stems_url IS NOT NULL THEN '✅ Has stems'
    ELSE '❌ No stems'
  END as stems_status,
  created_at
FROM tracks 
ORDER BY created_at DESC 
LIMIT 20;

-- Show tracks that still don't have stems (for manual review)
SELECT 
  id,
  title,
  track_producer_id,
  created_at,
  'Needs manual review' as status
FROM tracks 
WHERE stems_url IS NULL
ORDER BY created_at DESC 
LIMIT 10;

-- Summary by producer
SELECT 
  track_producer_id,
  COUNT(*) as total_tracks,
  COUNT(stems_url) as tracks_with_stems,
  ROUND((COUNT(stems_url)::numeric / COUNT(*) * 100), 2) as percentage_with_stems
FROM tracks 
GROUP BY track_producer_id
ORDER BY total_tracks DESC
LIMIT 10; 