-- Fix tracks table: Convert signed URLs to file paths for public bucket access
-- This converts expired signed URLs to the file paths that our React code expects

-- First, let's see what we're working with
SELECT 
  id,
  title,
  image_url,
  CASE
    WHEN image_url LIKE '%/object/sign/track-images/%' THEN 'SIGNED_URL'
    WHEN image_url LIKE '%/object/public/track-images/%' THEN 'PUBLIC_URL'
    WHEN image_url LIKE '%?token=%' THEN 'TRUNCATED_SIGNED_URL'
    WHEN image_url LIKE '%/%' AND image_url NOT LIKE 'https://%' AND image_url NOT LIKE '%?token=%' THEN 'FILE_PATH'
    WHEN image_url LIKE 'https://images.unsplash.com%' THEN 'UNSPLASH_DEFAULT'
    WHEN image_url IS NULL OR image_url = '' THEN 'NULL_OR_EMPTY'
    ELSE 'OTHER'
  END as image_type
FROM tracks
WHERE image_url IS NOT NULL AND image_url != ''
ORDER BY image_type, title;

-- Convert signed URLs to file paths
UPDATE tracks
SET image_url = regexp_replace(image_url, '^https://[^/]+/storage/v1/object/sign/track-images/', '')
WHERE image_url LIKE '%/object/sign/track-images/%';

-- Convert truncated signed URLs (path + token) to clean file paths
UPDATE tracks
SET image_url = regexp_replace(image_url, '\?token=.*$', '')
WHERE image_url LIKE '%?token=%';

-- Convert public URLs to file paths (optional cleanup)
UPDATE tracks
SET image_url = regexp_replace(image_url, '^https://[^/]+/storage/v1/object/public/track-images/', '')
WHERE image_url LIKE '%/object/public/track-images/%';

-- Verify the changes
SELECT 
  id,
  title,
  image_url,
  CASE
    WHEN image_url LIKE '%/%' AND image_url NOT LIKE 'https://%' AND image_url NOT LIKE '%?token=%' THEN 'FILE_PATH'
    WHEN image_url LIKE 'https://images.unsplash.com%' THEN 'UNSPLASH_DEFAULT'
    WHEN image_url IS NULL OR image_url = '' THEN 'NULL_OR_EMPTY'
    ELSE 'OTHER'
  END as image_type
FROM tracks
WHERE image_url IS NOT NULL AND image_url != ''
ORDER BY image_type, title;

-- Example of what a track should look like after the fix:
-- Before: https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/sign/track-images/83e21f94-aced-452a-bafb-6eb9629e3b18/SMOKE%20AND%20DRANK/cover.jpg?token=...
-- After: 83e21f94-aced-452a-bafb-6eb9629e3b18/SMOKE AND DRANK/cover.jpg
