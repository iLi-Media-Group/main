-- Investigate the Oil Money track issue
SELECT 
  id,
  title,
  audio_url,
  image_url,
  created_at,
  updated_at,
  track_producer_id
FROM tracks 
WHERE title = 'Oil Money'
ORDER BY created_at DESC;

-- Check if there are any files in the track-audio bucket for this producer
-- You'll need to check this manually in Supabase Storage dashboard
-- Look for files in: track-audio/83e21f94-aced-452a-bafb-6eb9629e3b18/Oil Money/

-- If you find the file, update the audio_url manually
-- Replace 'FILENAME.mp3' with the actual filename you find in the bucket
-- UPDATE tracks 
-- SET audio_url = '83e21f94-aced-452a-bafb-6eb9629e3b18/Oil Money/FILENAME.mp3'
-- WHERE id = 'd20d2d96-e281-419e-b2c7-1195247ffd8a';

-- Check all tracks with null audio_url
SELECT 
  id,
  title,
  audio_url,
  created_at
FROM tracks 
WHERE audio_url IS NULL
ORDER BY created_at DESC; 