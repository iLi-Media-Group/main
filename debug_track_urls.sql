-- Debug the recently uploaded track's URLs
-- Check what URLs are stored for audio and image

SELECT 
  id,
  title,
  audio_url,
  image_url,
  created_at,
  track_producer_id
FROM tracks 
ORDER BY created_at DESC 
LIMIT 3;

-- Check if the URLs are accessible
-- You can test these URLs in your browser to see if they work

-- Also check if there are any RLS policies blocking access to the files
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('storage.objects', 'storage.buckets')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname; 