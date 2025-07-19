-- Debug current image URL state
SELECT 
  id,
  title,
  image_url,
  CASE 
    WHEN image_url LIKE 'https://%' THEN 'PUBLIC_URL'
    WHEN image_url LIKE '%/%' THEN 'FILE_PATH'
    WHEN image_url LIKE 'https://images.unsplash.com%' THEN 'UNSPLASH_DEFAULT'
    ELSE 'OTHER'
  END as image_url_type,
  created_at
FROM tracks 
ORDER BY created_at DESC 
LIMIT 10; 