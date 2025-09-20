-- Check if genre data was inserted properly

-- Count genres and sub-genres
SELECT '=== DATA COUNTS ===' as info;
SELECT 'Genres:' as type, COUNT(*) as count FROM genres
UNION ALL
SELECT 'Sub-Genres:' as type, COUNT(*) as count FROM sub_genres;

-- Show all genres
SELECT '=== ALL GENRES ===' as info;
SELECT 
  name,
  display_name,
  created_at
FROM genres 
ORDER BY display_name;

-- Show sample sub-genres
SELECT '=== SAMPLE SUB-GENRES ===' as info;
SELECT 
  g.display_name as parent_genre,
  sg.display_name as sub_genre
FROM sub_genres sg
JOIN genres g ON sg.genre_id = g.id
ORDER BY g.display_name, sg.display_name
LIMIT 20; 

-- Check genre data in tracks table
SELECT 
  id,
  title,
  artist,
  genres,
  sub_genres,
  moods,
  bpm,
  created_at
FROM tracks 
WHERE deleted_at IS NULL 
  AND is_sync_only = false
LIMIT 10;

-- Check distinct genres
SELECT DISTINCT genres 
FROM tracks 
WHERE deleted_at IS NULL 
  AND genres IS NOT NULL 
  AND genres != '';

-- Check total count of tracks
SELECT COUNT(*) as total_tracks 
FROM tracks 
WHERE deleted_at IS NULL 
  AND is_sync_only = false; 