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