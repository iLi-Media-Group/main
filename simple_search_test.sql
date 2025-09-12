-- Simple search test to verify database search works

-- Test 1: Search for "Soul" in sub_genres (we know this exists)
SELECT 'Search for "Soul" in sub_genres:' as test;
SELECT 
  id,
  title,
  sub_genres
FROM tracks 
WHERE sub_genres LIKE '%Soul%'
LIMIT 5;

-- Test 2: Search for "Hip-Hop" in genres (we know this exists)
SELECT 'Search for "Hip-Hop" in genres:' as test;
SELECT 
  id,
  title,
  genres
FROM tracks 
WHERE genres LIKE '%Hip-Hop%'
LIMIT 5;

-- Test 3: Search for "joyful" in moods (we know this exists)
SELECT 'Search for "joyful" in moods:' as test;
SELECT 
  id,
  title,
  moods
FROM tracks 
WHERE moods::text LIKE '%joyful%'
LIMIT 5;

-- Test 4: Count total tracks
SELECT 'Total tracks in database:' as test;
SELECT COUNT(*) as total_tracks FROM tracks;
