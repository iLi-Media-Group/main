-- Check the actual data types of the columns

SELECT 'Column data types:' as info;
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tracks' 
  AND column_name IN ('genres', 'sub_genres', 'moods', 'instruments', 'media_usage')
ORDER BY column_name;

-- Show a few sample tracks to see the actual data format
SELECT 'Sample tracks with data:' as info;
SELECT 
  id,
  title,
  genres,
  sub_genres,
  moods,
  instruments,
  media_usage
FROM tracks 
LIMIT 3;
