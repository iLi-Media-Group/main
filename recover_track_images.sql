-- Recover broken track images from the database incident
-- This script will convert broken URLs back to proper file paths

-- First, let's see what we're working with
SELECT 
  'BEFORE RECOVERY' as status,
  COUNT(*) as total_tracks,
  COUNT(CASE WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/%' THEN 1 END) as broken_urls,
  COUNT(CASE WHEN image_url LIKE '%/%' AND image_url NOT LIKE 'https://%' THEN 1 END) as working_paths,
  COUNT(CASE WHEN image_url LIKE 'https://images.unsplash.com%' THEN 1 END) as default_images
FROM tracks;

-- Step 1: Fix double URLs (from the earlier incident)
-- These are URLs that got duplicated during the database incident
UPDATE tracks 
SET image_url = 
  CASE 
    -- Extract file path from double URL pattern: 
    -- https://project.supabase.co/storage/v1/object/sign/track-images/https://project.supabase.co/storage/v1/object/sign/track-images/user-id/track-title/cover.jpg
    WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/sign/track-images/https://%.supabase.co/storage/v1/object/sign/track-images/%' 
    THEN SUBSTRING(image_url FROM 'track-images/(.+)$')
    
    -- Extract file path from public URL pattern:
    -- https://project.supabase.co/storage/v1/object/public/track-images/user-id/track-title/cover.jpg
    WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/public/track-images/%' 
    THEN SUBSTRING(image_url FROM 'track-images/(.+)$')
    
    -- Extract file path from signed URL pattern:
    -- https://project.supabase.co/storage/v1/object/sign/track-images/user-id/track-title/cover.jpg
    WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/sign/track-images/%' 
    THEN SUBSTRING(image_url FROM 'track-images/(.+)$')
    
    -- Keep as is if it's already a file path or a public URL (like Unsplash)
    ELSE image_url
  END
WHERE image_url LIKE 'https://%.supabase.co/storage/v1/object/%';

-- Step 2: Set default images for tracks that have no image or broken URLs
UPDATE tracks 
SET image_url = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop'
WHERE image_url IS NULL 
   OR image_url = '' 
   OR image_url NOT LIKE '%/%' 
   OR image_url LIKE 'https://%' -- Any remaining full URLs that didn't get fixed

-- Step 3: Verify the recovery
SELECT 
  'AFTER RECOVERY' as status,
  COUNT(*) as total_tracks,
  COUNT(CASE WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/%' THEN 1 END) as broken_urls,
  COUNT(CASE WHEN image_url LIKE '%/%' AND image_url NOT LIKE 'https://%' THEN 1 END) as working_paths,
  COUNT(CASE WHEN image_url LIKE 'https://images.unsplash.com%' THEN 1 END) as default_images
FROM tracks;

-- Show sample of recovered tracks
SELECT 
  id,
  title,
  image_url,
  CASE 
    WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/%' THEN 'STILL_BROKEN'
    WHEN image_url LIKE '%/%' AND image_url NOT LIKE 'https://%' THEN 'WORKING_PATH'
    WHEN image_url LIKE 'https://images.unsplash.com%' THEN 'DEFAULT_IMAGE'
    ELSE 'OTHER'
  END as recovery_status,
  created_at
FROM tracks 
ORDER BY created_at DESC 
LIMIT 20;

-- Check if there are any remaining broken URLs
SELECT 
  'REMAINING_BROKEN_URLS' as issue,
  COUNT(*) as count
FROM tracks 
WHERE image_url LIKE 'https://%.supabase.co/storage/v1/object/%';

-- If there are still broken URLs, show them
SELECT 
  id,
  title,
  image_url,
  created_at
FROM tracks 
WHERE image_url LIKE 'https://%.supabase.co/storage/v1/object/%'
ORDER BY created_at DESC 
LIMIT 10;
