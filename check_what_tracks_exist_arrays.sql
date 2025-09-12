-- Check what tracks and genres actually exist in the database
-- Fixed for array fields

-- 1. Total tracks count
SELECT 'Total tracks in database:' as info;
SELECT COUNT(*) as total_tracks FROM tracks;

-- 2. Check the data type of genres column
SELECT 'Genres column data type:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tracks' AND column_name = 'genres';

-- 3. Sample tracks with their data
SELECT 'Sample tracks with their data:' as info;
SELECT 
  id,
  title,
  genres,
  sub_genres,
  moods,
  instruments,
  media_usage
FROM tracks 
LIMIT 10;

-- 4. Check if genres field contains any data
SELECT 'Tracks with genres data:' as info;
SELECT 
  id,
  title,
  genres
FROM tracks 
WHERE genres IS NOT NULL AND array_length(genres, 1) > 0
LIMIT 5;

-- 5. Check if sub_genres field contains any data
SELECT 'Tracks with sub_genres data:' as info;
SELECT 
  id,
  title,
  sub_genres
FROM tracks 
WHERE sub_genres IS NOT NULL AND array_length(sub_genres, 1) > 0
LIMIT 5;

-- 6. Check if moods field contains any data
SELECT 'Tracks with moods data:' as info;
SELECT 
  id,
  title,
  moods
FROM tracks 
WHERE moods IS NOT NULL AND array_length(moods, 1) > 0
LIMIT 5;

-- 7. Check if instruments field contains any data
SELECT 'Tracks with instruments data:' as info;
SELECT 
  id,
  title,
  instruments
FROM tracks 
WHERE instruments IS NOT NULL AND array_length(instruments, 1) > 0
LIMIT 5;

-- 8. Show all unique genres that exist
SELECT 'All unique genres in database:' as info;
SELECT DISTINCT unnest(genres) as genre
FROM tracks 
WHERE genres IS NOT NULL AND array_length(genres, 1) > 0
ORDER BY genre;
