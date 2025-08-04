-- Debug genre search functionality
-- Test search for "Hip Hop" genre
SELECT 
  id,
  title,
  artist,
  genres,
  sub_genres,
  moods,
  bpm
FROM tracks 
WHERE deleted_at IS NULL 
  AND is_sync_only = false
  AND (
    genres ILIKE '%Hip Hop%' OR
    genres ILIKE '%hip hop%' OR
    genres ILIKE '%HipHop%'
  )
LIMIT 10;

-- Test search for "Pop" genre
SELECT 
  id,
  title,
  artist,
  genres,
  sub_genres,
  moods,
  bpm
FROM tracks 
WHERE deleted_at IS NULL 
  AND is_sync_only = false
  AND (
    genres ILIKE '%Pop%' OR
    genres ILIKE '%pop%'
  )
LIMIT 10;

-- Check if any tracks have genres at all
SELECT 
  COUNT(*) as tracks_with_genres,
  COUNT(CASE WHEN genres IS NULL OR genres = '' THEN 1 END) as tracks_without_genres
FROM tracks 
WHERE deleted_at IS NULL 
  AND is_sync_only = false; 