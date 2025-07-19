-- Check current image_url status
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

-- Update tracks that have public URLs to use just the file path
UPDATE tracks 
SET image_url = 
  CASE 
    -- Extract file path from public URL pattern: https://project.supabase.co/storage/v1/object/public/track-images/user-id/track-title/filename.jpg
    WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/public/track-images/%' 
    THEN SUBSTRING(image_url FROM 'track-images/(.+)$')
    
    -- Keep Unsplash default images as they are
    WHEN image_url LIKE 'https://images.unsplash.com%' 
    THEN image_url
    
    -- Keep as is if it's already a file path or simple filename
    ELSE image_url
  END
WHERE image_url LIKE 'https://%.supabase.co/storage/v1/object/public/track-images/%';

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