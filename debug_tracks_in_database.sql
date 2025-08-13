-- Check if there are any tracks in the database
SELECT 'Total tracks count:' as info;
SELECT COUNT(*) as total_tracks FROM tracks;

-- Check if tracks are published and visible
SELECT 'Published tracks count:' as info;
SELECT COUNT(*) as published_tracks FROM tracks WHERE published = true;

-- Show sample tracks with their data
SELECT 'Sample tracks with data:' as info;
SELECT 
  id,
  title,
  genres,
  sub_genres,
  moods,
  instruments,
  media_usage,
  published,
  created_at
FROM tracks 
WHERE published = true
LIMIT 5;

-- Check if there are any jazz tracks specifically
SELECT 'Jazz tracks:' as info;
SELECT 
  id,
  title,
  genres,
  sub_genres,
  moods,
  instruments,
  media_usage
FROM tracks 
WHERE published = true 
  AND (genres::text LIKE '%jazz%' OR sub_genres::text LIKE '%jazz%')
LIMIT 5;

-- Check if there are any hip hop tracks
SELECT 'Hip hop tracks:' as info;
SELECT 
  id,
  title,
  genres,
  sub_genres,
  moods,
  instruments,
  media_usage
FROM tracks 
WHERE published = true 
  AND (genres::text LIKE '%hip%' OR sub_genres::text LIKE '%hip%')
LIMIT 5;
