-- Test all playlists to see if they're accessible
-- Check all playlists in the database
SELECT 
  id,
  name,
  slug,
  producer_id,
  creator_type,
  is_public,
  created_at
FROM playlists 
ORDER BY created_at DESC;

-- Check the most recent playlist specifically
SELECT 
  id,
  name,
  slug,
  producer_id,
  creator_type,
  is_public,
  created_at
FROM playlists 
ORDER BY created_at DESC
LIMIT 1;

-- Check if there are any playlists with the slug format we expect
SELECT 
  id,
  name,
  slug,
  CASE 
    WHEN slug LIKE '%/%' THEN 'Has slash format'
    ELSE 'Single slug format'
  END as slug_format
FROM playlists 
ORDER BY created_at DESC;
