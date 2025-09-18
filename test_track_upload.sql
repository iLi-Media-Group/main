-- Test script to verify track upload functionality
-- Run this in Supabase SQL editor

-- 1. Check if any tracks exist for the user (replace with actual user ID)
-- First, let's see what user IDs exist in the tracks table
SELECT DISTINCT track_producer_id, COUNT(*) as track_count
FROM tracks 
WHERE deleted_at IS NULL
GROUP BY track_producer_id
ORDER BY track_count DESC;

-- 2. Check the most recent tracks regardless of user
SELECT 
  id,
  title,
  track_producer_id,
  audio_url,
  created_at,
  deleted_at,
  genres,
  bpm
FROM tracks 
WHERE deleted_at IS NULL
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check if there are any tracks created in the last hour
SELECT 
  id,
  title,
  track_producer_id,
  audio_url,
  created_at,
  deleted_at
FROM tracks 
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- 4. Test the exact query that the dashboard uses
-- Replace 'YOUR_USER_ID' with an actual user ID from step 1
-- SELECT 
--   id,
--   title,
--   genres,
--   moods,
--   media_usage,
--   bpm,
--   audio_url,
--   image_url,
--   created_at,
--   has_vocals,
--   vocals_usage_type
-- FROM tracks 
-- WHERE track_producer_id = 'YOUR_USER_ID'
--   AND deleted_at IS NULL
-- ORDER BY created_at DESC; 