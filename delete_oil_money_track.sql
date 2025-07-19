-- Delete the Oil Money track that has null audio_url
DELETE FROM tracks 
WHERE id = 'd20d2d96-e281-419e-b2c7-1195247ffd8a';

-- Verify the deletion
SELECT 
  id,
  title,
  audio_url
FROM tracks 
WHERE title = 'Oil Money'; 