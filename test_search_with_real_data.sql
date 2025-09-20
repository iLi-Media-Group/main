-- Test search with real data from your tracks

-- Test 1: Search for "Soul" in sub_genres
SELECT 'Tracks with "Soul" in sub_genres:' as test;
SELECT 
  id,
  title,
  sub_genres
FROM tracks 
WHERE sub_genres LIKE '%Soul%'
LIMIT 5;

-- Test 2: Search for "Hip-Hop" in genres
SELECT 'Tracks with "Hip-Hop" in genres:' as test;
SELECT 
  id,
  title,
  genres
FROM tracks 
WHERE genres LIKE '%Hip-Hop%'
LIMIT 5;

-- Test 3: Search for "joyful" in moods
SELECT 'Tracks with "joyful" in moods:' as test;
SELECT 
  id,
  title,
  moods
FROM tracks 
WHERE moods::text LIKE '%joyful%'
LIMIT 5;

-- Test 4: Search for "Television" in media_usage
SELECT 'Tracks with "Television" in media_usage:' as test;
SELECT 
  id,
  title,
  media_usage
FROM tracks 
WHERE media_usage::text LIKE '%Television%'
LIMIT 5;
