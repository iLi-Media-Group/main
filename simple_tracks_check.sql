-- Simple check of what's actually in the tracks table

-- 1. Total tracks count
SELECT 'Total tracks in database:' as info;
SELECT COUNT(*) as total_tracks FROM tracks;

-- 2. Check column data types
SELECT 'Column data types:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tracks' 
  AND column_name IN ('genres', 'sub_genres', 'moods', 'instruments', 'media_usage')
ORDER BY column_name;

-- 3. Sample tracks - just show what's there
SELECT 'Sample tracks:' as info;
SELECT 
  id,
  title,
  genres,
  sub_genres,
  moods,
  instruments,
  media_usage
FROM tracks 
LIMIT 5;

-- 4. Check if any tracks have genre data
SELECT 'Tracks with any genre data:' as info;
SELECT 
  id,
  title,
  genres
FROM tracks 
WHERE genres IS NOT NULL AND genres != ''
LIMIT 5;

-- 5. Check if any tracks have sub_genre data
SELECT 'Tracks with any sub_genre data:' as info;
SELECT 
  id,
  title,
  sub_genres
FROM tracks 
WHERE sub_genres IS NOT NULL AND sub_genres != ''
LIMIT 5;
