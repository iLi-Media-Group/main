-- Simple script to populate stems_url for existing tracks
-- This script assumes stems files follow the pattern: {user_id}/{track_title}/stems.zip

-- Method 1: Update based on track title pattern
-- This assumes stems are stored as: {user_id}/{track_title}/stems.zip
UPDATE tracks 
SET stems_url = CONCAT(track_producer_id, '/', REPLACE(title, ' ', '_'), '/stems.zip')
WHERE stems_url IS NULL 
  AND track_producer_id IS NOT NULL 
  AND title IS NOT NULL
  AND title != '';

-- Method 2: Update based on track ID pattern  
-- This assumes stems are stored as: {user_id}/{track_id}/stems.zip
UPDATE tracks 
SET stems_url = CONCAT(track_producer_id, '/', id::text, '/stems.zip')
WHERE stems_url IS NULL 
  AND track_producer_id IS NOT NULL 
  AND id IS NOT NULL;

-- Method 3: Manual updates for specific tracks (if you know they have stems)
-- Uncomment and modify these lines for specific tracks you know have stems
/*
UPDATE tracks 
SET stems_url = 'user_id/track_title/stems.zip'
WHERE id = 'specific_track_id';

UPDATE tracks 
SET stems_url = 'another_user_id/another_track/stems.zip'
WHERE id = 'another_track_id';
*/

-- Check results
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

-- Summary statistics
SELECT 
  COUNT(*) as total_tracks,
  COUNT(stems_url) as tracks_with_stems,
  COUNT(*) - COUNT(stems_url) as tracks_without_stems,
  ROUND((COUNT(stems_url)::numeric / COUNT(*) * 100), 2) as percentage_with_stems
FROM tracks; 