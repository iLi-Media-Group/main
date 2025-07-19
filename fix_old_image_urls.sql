-- Fix old tracks that have simple filenames (missing folder structure)
-- Set them to use the default Unsplash image

UPDATE tracks 
SET image_url = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop'
WHERE image_url NOT LIKE '%/%' 
  AND image_url NOT LIKE 'https://%'
  AND image_url IS NOT NULL;

-- Verify the changes
SELECT 
  id,
  title,
  image_url,
  CASE 
    WHEN image_url LIKE 'https://%' THEN 'PUBLIC_URL'
    WHEN image_url LIKE '%/%' THEN 'FILE_PATH'
    WHEN image_url LIKE 'https://images.unsplash.com%' THEN 'UNSPLASH_DEFAULT'
    ELSE 'OTHER'
  END as image_url_type
FROM tracks 
ORDER BY created_at DESC 
LIMIT 10; 