-- Check current genres and sub-genres in the database
SELECT '=== CURRENT GENRES ===' as info;

SELECT 
  id,
  name,
  display_name,
  created_at
FROM genres 
ORDER BY display_name;

SELECT '=== CURRENT SUB-GENRES ===' as info;

SELECT 
  sg.id,
  sg.name,
  sg.display_name,
  sg.genre_id,
  g.name as genre_name,
  sg.created_at
FROM sub_genres sg
LEFT JOIN genres g ON sg.genre_id = g.id
ORDER BY g.display_name, sg.display_name;

SELECT '=== GENRE COUNT ===' as info;
SELECT COUNT(*) as total_genres FROM genres;

SELECT '=== SUB-GENRE COUNT ===' as info;
SELECT COUNT(*) as total_sub_genres FROM sub_genres; 