-- Debug the recently uploaded track to see why it's not showing in the dashboard

-- 1. Check the most recently uploaded track
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
  key
FROM tracks 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check if there are any tracks for the specific producer (replace with actual user ID)
-- SELECT 
--   id,
--   title,
--   track_producer_id,
--   audio_url,
--   created_at,
--   deleted_at
-- FROM tracks 
-- WHERE track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
-- ORDER BY created_at DESC;

-- 3. Check the tracks table structure to see if deleted_at field exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' 
  AND column_name IN ('id', 'title', 'track_producer_id', 'deleted_at', 'created_at')
ORDER BY column_name;

-- 4. Check if there are any RLS policies blocking the read
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'tracks'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- 5. Test the exact query that the dashboard uses
-- Replace 'YOUR_USER_ID' with the actual user ID
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