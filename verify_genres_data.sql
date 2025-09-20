-- Verify Genre Data and Access
-- Run this to check if genres are properly populated and accessible

-- Check genre counts
SELECT '=== GENRE DATA VERIFICATION ===' as info;

SELECT 'Total Genres:' as label, COUNT(*) as count FROM genres
UNION ALL
SELECT 'Total Sub-Genres:' as label, COUNT(*) as count FROM sub_genres;

-- Show sample genres
SELECT '=== SAMPLE GENRES ===' as info;
SELECT 
  id,
  name,
  display_name,
  created_at
FROM genres 
ORDER BY display_name 
LIMIT 10;

-- Show sample sub-genres with their parent genres
SELECT '=== SAMPLE SUB-GENRES ===' as info;
SELECT 
  g.display_name as parent_genre,
  sg.display_name as sub_genre,
  sg.name as sub_genre_name
FROM sub_genres sg
JOIN genres g ON sg.genre_id = g.id
ORDER BY g.display_name, sg.display_name
LIMIT 15;

-- Test access for different user types (this will show what a logged-in user would see)
SELECT '=== ACCESS TEST ===' as info;
SELECT 
  'Current auth.uid():' as info,
  auth.uid() as current_user_id;

-- Check if we can query genres as the current user
SELECT '=== GENRE QUERY TEST ===' as info;
SELECT 
  COUNT(*) as accessible_genres
FROM genres;

SELECT '=== SUB-GENRE QUERY TEST ===' as info;
SELECT 
  COUNT(*) as accessible_sub_genres
FROM sub_genres;

-- Show first few genres that should be accessible
SELECT '=== ACCESSIBLE GENRES ===' as info;
SELECT 
  display_name,
  name
FROM genres 
ORDER BY display_name 
LIMIT 5; 