-- Debug script to check uploaded track status
-- Run this in Supabase SQL editor to diagnose the issue

-- 1. Check the most recently uploaded tracks
SELECT 
  id,
  title,
  track_producer_id,
  audio_url,
  created_at,
  updated_at,
  deleted_at,
  genres,
  bpm,
  key,
  has_vocals,
  is_sync_only
FROM tracks 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check if there are any tracks for the specific producer (replace with actual user ID)
-- SELECT 
--   id,
--   title,
--   track_producer_id,
--   audio_url,
--   created_at,
--   deleted_at,
--   genres,
--   bpm
-- FROM tracks 
-- WHERE track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
-- ORDER BY created_at DESC;

-- 3. Check the tracks table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' 
  AND column_name IN ('id', 'title', 'track_producer_id', 'deleted_at', 'created_at', 'audio_url', 'genres')
ORDER BY column_name;

-- 4. Check RLS policies for tracks table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'tracks'
ORDER BY policyname;

-- 5. Test the exact query that the dashboard uses
-- Replace 'YOUR_USER_ID' with the actual user ID from step 1
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

-- 6. Check if there are any tracks with null track_producer_id
SELECT 
  COUNT(*) as tracks_with_null_producer,
  COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active_tracks_with_null_producer
FROM tracks 
WHERE track_producer_id IS NULL;

-- 7. Check for any tracks that might have been inserted with wrong data
SELECT 
  id,
  title,
  track_producer_id,
  audio_url,
  created_at,
  deleted_at
FROM tracks 
WHERE track_producer_id IS NOT NULL
  AND deleted_at IS NULL
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC; 