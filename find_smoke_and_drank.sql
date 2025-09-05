-- Find the specific "SMOKE AND DRANK" track and see its image status
SELECT 
  id,
  title,
  image_url,
  CASE 
    WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/%' THEN 'BROKEN_URL'
    WHEN image_url LIKE '%/%' AND image_url NOT LIKE 'https://%' THEN 'FILE_PATH'
    WHEN image_url LIKE 'https://images.unsplash.com%' THEN 'UNSPLASH_DEFAULT'
    WHEN image_url IS NULL OR image_url = '' THEN 'NULL_OR_EMPTY'
    ELSE 'OTHER'
  END as image_url_type,
  created_at
FROM tracks 
WHERE title ILIKE '%SMOKE AND DRANK%'
   OR title ILIKE '%SMOKE%DRANK%'
   OR title ILIKE '%SMOKE & DRANK%'
ORDER BY created_at DESC;

