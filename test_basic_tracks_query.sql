-- Simple test to see if tracks can be queried
-- This will help us understand if the issue is with RLS or something else

-- Test 1: Basic count
SELECT 'Basic track count:' as test;
SELECT COUNT(*) as total_tracks FROM tracks;

-- Test 2: Check if any tracks exist with data
SELECT 'Tracks with data:' as test;
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

-- Test 3: Check if there are any jazz tracks
SELECT 'Jazz tracks:' as test;
SELECT 
  id,
  title,
  genres,
  sub_genres
FROM tracks 
WHERE genres::text LIKE '%jazz%' OR sub_genres::text LIKE '%jazz%'
LIMIT 3;

-- Test 4: Check if there are any hip hop tracks  
SELECT 'Hip hop tracks:' as test;
SELECT 
  id,
  title,
  genres,
  sub_genres
FROM tracks 
WHERE genres::text LIKE '%hip%' OR sub_genres::text LIKE '%hip%'
LIMIT 3;
