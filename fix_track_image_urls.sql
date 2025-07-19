-- Fix track image URLs that are causing 400 errors
-- This script will set default images for tracks with missing images

-- First, let's see what track images we have
SELECT id, title, image_url 
FROM tracks 
WHERE image_url IS NOT NULL 
AND image_url != ''
ORDER BY created_at DESC
LIMIT 10;

-- Update tracks with problematic image URLs to use default image
UPDATE tracks 
SET image_url = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop'
WHERE image_url LIKE '%0.3409714882930397.png%'
   OR image_url LIKE '%track-images%'
   OR image_url IS NULL
   OR image_url = '';

-- Show the updated tracks
SELECT id, title, image_url 
FROM tracks 
WHERE image_url LIKE '%unsplash%'
ORDER BY created_at DESC
LIMIT 10; 