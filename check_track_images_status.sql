-- Check current track image status and identify potential issues
-- This will help us understand what happened during the database incident

-- First, let's see the overall picture of track images
SELECT 
  COUNT(*) as total_tracks,
  COUNT(image_url) as tracks_with_images,
  COUNT(CASE WHEN image_url IS NULL OR image_url = '' THEN 1 END) as tracks_without_images,
  COUNT(CASE WHEN image_url LIKE 'https://images.unsplash.com%' THEN 1 END) as tracks_with_default_images,
  COUNT(CASE WHEN image_url LIKE 'https://%.supabase.co%' THEN 1 END) as tracks_with_supabase_urls,
  COUNT(CASE WHEN image_url LIKE '%/%' AND image_url NOT LIKE 'https://%' THEN 1 END) as tracks_with_file_paths
FROM tracks;

-- Check for different URL patterns that might be broken
SELECT 
  'FULL_SUPABASE_URL' as url_type,
  COUNT(*) as count,
  'Tracks with full Supabase URLs (might be broken)' as description
FROM tracks 
WHERE image_url LIKE 'https://%.supabase.co/storage/v1/object/%'
UNION ALL
SELECT 
  'FILE_PATH' as url_type,
  COUNT(*) as count,
  'Tracks with file paths (should work with signed URLs)' as description
FROM tracks 
WHERE image_url LIKE '%/%' AND image_url NOT LIKE 'https://%'
UNION ALL
SELECT 
  'UNSPLASH_DEFAULT' as url_type,
  COUNT(*) as count,
  'Tracks with Unsplash default images' as description
FROM tracks 
WHERE image_url LIKE 'https://images.unsplash.com%'
UNION ALL
SELECT 
  'NULL_OR_EMPTY' as url_type,
  COUNT(*) as count,
  'Tracks with no image URL' as description
FROM tracks 
WHERE image_url IS NULL OR image_url = '';

-- Show sample tracks with each type of image URL
SELECT 
  'FULL_SUPABASE_URL' as url_type,
  id,
  title,
  image_url,
  created_at
FROM tracks 
WHERE image_url LIKE 'https://%.supabase.co/storage/v1/object/%'
ORDER BY created_at DESC 
LIMIT 5;

SELECT 
  'FILE_PATH' as url_type,
  id,
  title,
  image_url,
  created_at
FROM tracks 
WHERE image_url LIKE '%/%' AND image_url NOT LIKE 'https://%'
ORDER BY created_at DESC 
LIMIT 5;

SELECT 
  'UNSPLASH_DEFAULT' as url_type,
  id,
  title,
  image_url,
  created_at
FROM tracks 
WHERE image_url LIKE 'https://images.unsplash.com%'
ORDER BY created_at DESC 
LIMIT 5;

-- Check for tracks with potentially broken double URLs (from the earlier incident)
SELECT 
  'DOUBLE_URL' as url_type,
  id,
  title,
  image_url,
  created_at
FROM tracks 
WHERE image_url LIKE 'https://%.supabase.co/storage/v1/object/sign/track-images/https://%'
ORDER BY created_at DESC 
LIMIT 10;

-- Check recent tracks to see the pattern
SELECT 
  id,
  title,
  image_url,
  CASE 
    WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/sign/track-images/https://%' THEN 'DOUBLE_URL'
    WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/%' THEN 'FULL_SUPABASE_URL'
    WHEN image_url LIKE '%/%' AND image_url NOT LIKE 'https://%' THEN 'FILE_PATH'
    WHEN image_url LIKE 'https://images.unsplash.com%' THEN 'UNSPLASH_DEFAULT'
    WHEN image_url IS NULL OR image_url = '' THEN 'NULL_OR_EMPTY'
    ELSE 'OTHER'
  END as url_type,
  created_at
FROM tracks 
ORDER BY created_at DESC 
LIMIT 20;
