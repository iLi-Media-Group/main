-- Check what tracks and genres actually exist in the database

-- 1. Total tracks count
SELECT 'Total tracks in database:' as info;
SELECT COUNT(*) as total_tracks FROM tracks;

-- 2. All unique genres that exist
SELECT 'All unique genres in database:' as info;
SELECT DISTINCT unnest(genres) as genre
FROM tracks 
WHERE genres IS NOT NULL AND array_length(genres, 1) > 0
ORDER BY genre;

-- 3. All unique sub-genres that exist
SELECT 'All unique sub-genres in database:' as info;
SELECT DISTINCT unnest(sub_genres) as sub_genre
FROM tracks 
WHERE sub_genres IS NOT NULL AND array_length(sub_genres, 1) > 0
ORDER BY sub_genre;

-- 4. All unique moods that exist
SELECT 'All unique moods in database:' as info;
SELECT DISTINCT unnest(moods) as mood
FROM tracks 
WHERE moods IS NOT NULL AND array_length(moods, 1) > 0
ORDER BY mood;

-- 5. All unique instruments that exist
SELECT 'All unique instruments in database:' as info;
SELECT DISTINCT unnest(instruments) as instrument
FROM tracks 
WHERE instruments IS NOT NULL AND array_length(instruments, 1) > 0
ORDER BY instrument;

-- 6. Sample tracks with their data
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
