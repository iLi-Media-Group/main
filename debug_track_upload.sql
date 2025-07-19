-- Debug script to check track uploads and database issues

-- 1. Check recent tracks in the database
SELECT 
  id,
  title,
  track_producer_id,
  audio_url,
  created_at,
  updated_at,
  genres,
  bpm,
  key
FROM tracks 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check if there are any tracks for a specific producer (replace with actual user ID)
-- SELECT 
--   id,
--   title,
--   track_producer_id,
--   audio_url,
--   created_at
-- FROM tracks 
-- WHERE track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
-- ORDER BY created_at DESC;

-- 3. Check tracks table structure and constraints
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' 
ORDER BY ordinal_position;

-- 4. Check for any recent errors in the database logs (if available)
-- This might not be available in the free tier

-- 5. Check if the tracks table has the correct RLS policies
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