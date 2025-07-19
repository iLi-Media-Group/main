-- Check the most recent audio_url values for tracks
SELECT 
  id,
  title,
  audio_url,
  created_at
FROM tracks 
ORDER BY created_at DESC 
LIMIT 10; 