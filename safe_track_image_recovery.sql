-- SAFE Track Image Recovery Script
-- This script will show you exactly what will be changed BEFORE making any updates
-- Run this first to see what would be affected

-- Step 1: Show the current state of ALL tracks
SELECT 
  'CURRENT_STATE' as analysis_type,
  COUNT(*) as total_tracks,
  COUNT(CASE WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/%' THEN 1 END) as broken_urls,
  COUNT(CASE WHEN image_url LIKE '%/%' AND image_url NOT LIKE 'https://%' THEN 1 END) as working_paths,
  COUNT(CASE WHEN image_url LIKE 'https://images.unsplash.com%' THEN 1 END) as default_images,
  COUNT(CASE WHEN image_url IS NULL OR image_url = '' THEN 1 END) as null_images
FROM tracks;

-- Step 2: Show EXACTLY what would be changed (PREVIEW ONLY - NO CHANGES)
SELECT 
  'PREVIEW_CHANGES' as analysis_type,
  id,
  title,
  image_url as current_image_url,
  CASE 
    -- Double URL pattern
    WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/sign/track-images/https://%.supabase.co/storage/v1/object/sign/track-images/%' 
    THEN SUBSTRING(image_url FROM 'track-images/(.+)$')
    
    -- Public URL pattern
    WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/public/track-images/%' 
    THEN SUBSTRING(image_url FROM 'track-images/(.+)$')
    
    -- Signed URL pattern
    WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/sign/track-images/%' 
    THEN SUBSTRING(image_url FROM 'track-images/(.+)$')
    
    -- Keep as is
    ELSE image_url
  END as proposed_new_image_url,
  CASE 
    WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/%' THEN 'WILL_BE_FIXED'
    ELSE 'NO_CHANGE'
  END as change_type,
  created_at
FROM tracks 
WHERE image_url LIKE 'https://%.supabase.co/storage/v1/object/%'
ORDER BY created_at DESC;

-- Step 3: Show tracks that would get default images
SELECT 
  'DEFAULT_IMAGE_CANDIDATES' as analysis_type,
  id,
  title,
  image_url as current_image_url,
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop' as proposed_new_image_url,
  'WILL_GET_DEFAULT' as change_type,
  created_at
FROM tracks 
WHERE image_url IS NULL 
   OR image_url = '' 
   OR (image_url NOT LIKE '%/%' AND image_url NOT LIKE 'https://images.unsplash.com%')
ORDER BY created_at DESC;

-- Step 4: Show tracks that will NOT be changed (for verification)
SELECT 
  'NO_CHANGE_TRACKS' as analysis_type,
  id,
  title,
  image_url,
  'SAFE_NO_CHANGE' as change_type,
  created_at
FROM tracks 
WHERE image_url NOT LIKE 'https://%.supabase.co/storage/v1/object/%'
  AND image_url IS NOT NULL 
  AND image_url != ''
  AND (image_url LIKE '%/%' OR image_url LIKE 'https://images.unsplash.com%')
ORDER BY created_at DESC
LIMIT 10;

-- Step 5: Summary of what would happen
SELECT 
  'SUMMARY' as analysis_type,
  'BROKEN_URLS_TO_FIX' as category,
  COUNT(*) as count
FROM tracks 
WHERE image_url LIKE 'https://%.supabase.co/storage/v1/object/%'
UNION ALL
SELECT 
  'SUMMARY' as analysis_type,
  'TRACKS_TO_GET_DEFAULT' as category,
  COUNT(*) as count
FROM tracks 
WHERE image_url IS NULL 
   OR image_url = '' 
   OR (image_url NOT LIKE '%/%' AND image_url NOT LIKE 'https://images.unsplash.com%')
UNION ALL
SELECT 
  'SUMMARY' as analysis_type,
  'TRACKS_SAFE_NO_CHANGE' as category,
  COUNT(*) as count
FROM tracks 
WHERE image_url NOT LIKE 'https://%.supabase.co/storage/v1/object/%'
  AND image_url IS NOT NULL 
  AND image_url != ''
  AND (image_url LIKE '%/%' OR image_url LIKE 'https://images.unsplash.com%');
