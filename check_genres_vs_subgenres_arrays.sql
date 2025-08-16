-- Check what's in genres vs sub_genres columns (arrays)

-- 1. Check genres column
SELECT 'Genres column data:' as info;
SELECT 
  id,
  title,
  genres
FROM tracks 
WHERE genres IS NOT NULL AND array_length(genres, 1) > 0
LIMIT 5;

-- 2. Check sub_genres column (we know this has data)
SELECT 'Sub_genres column data:' as info;
SELECT 
  id,
  title,
  sub_genres
FROM tracks 
WHERE sub_genres IS NOT NULL AND array_length(sub_genres, 1) > 0
LIMIT 5;

-- 3. Check if any tracks have both
SELECT 'Tracks with both genres and sub_genres:' as info;
SELECT 
  id,
  title,
  genres,
  sub_genres
FROM tracks 
WHERE (genres IS NOT NULL AND array_length(genres, 1) > 0)
  AND (sub_genres IS NOT NULL AND array_length(sub_genres, 1) > 0)
LIMIT 5;

-- 4. Check moods column
SELECT 'Moods column data:' as info;
SELECT 
  id,
  title,
  moods
FROM tracks 
WHERE moods IS NOT NULL AND array_length(moods, 1) > 0
LIMIT 5;

-- 5. Check instruments column
SELECT 'Instruments column data:' as info;
SELECT 
  id,
  title,
  instruments
FROM tracks 
WHERE instruments IS NOT NULL AND array_length(instruments, 1) > 0
LIMIT 5;

-- 6. Show all unique sub_genres that exist
SELECT 'All unique sub_genres in database:' as info;
SELECT DISTINCT unnest(sub_genres) as sub_genre
FROM tracks 
WHERE sub_genres IS NOT NULL AND array_length(sub_genres, 1) > 0
ORDER BY sub_genre;
