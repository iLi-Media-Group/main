-- TARGETED Track Image Recovery Script
-- Use this to fix specific tracks by ID or specific URL patterns
-- Much safer than the broad recovery script

-- Option 1: Fix specific tracks by ID (replace with your track IDs)
-- UPDATE tracks 
-- SET image_url = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop'
-- WHERE id IN ('track-id-1', 'track-id-2', 'track-id-3');

-- Option 2: Fix specific broken URL patterns (safer than broad approach)
-- This only fixes the most common broken patterns

-- Fix double URLs (the most common issue from database incidents)
UPDATE tracks 
SET image_url = SUBSTRING(image_url FROM 'track-images/(.+)$')
WHERE image_url LIKE 'https://%.supabase.co/storage/v1/object/sign/track-images/https://%.supabase.co/storage/v1/object/sign/track-images/%';

-- Fix public URLs
UPDATE tracks 
SET image_url = SUBSTRING(image_url FROM 'track-images/(.+)$')
WHERE image_url LIKE 'https://%.supabase.co/storage/v1/object/public/track-images/%';

-- Fix signed URLs
UPDATE tracks 
SET image_url = SUBSTRING(image_url FROM 'track-images/(.+)$')
WHERE image_url LIKE 'https://%.supabase.co/storage/v1/object/sign/track-images/%'
  AND image_url NOT LIKE 'https://%.supabase.co/storage/v1/object/sign/track-images/https://%'; -- Avoid double URLs

-- Set default images only for tracks with no image at all
UPDATE tracks 
SET image_url = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop'
WHERE image_url IS NULL OR image_url = '';

-- Verify the changes
SELECT 
  'AFTER_TARGETED_FIX' as status,
  COUNT(*) as total_tracks,
  COUNT(CASE WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/%' THEN 1 END) as remaining_broken_urls,
  COUNT(CASE WHEN image_url LIKE '%/%' AND image_url NOT LIKE 'https://%' THEN 1 END) as working_paths,
  COUNT(CASE WHEN image_url LIKE 'https://images.unsplash.com%' THEN 1 END) as default_images
FROM tracks;

-- Show any remaining broken URLs
SELECT 
  'REMAINING_BROKEN' as issue,
  id,
  title,
  image_url,
  created_at
FROM tracks 
WHERE image_url LIKE 'https://%.supabase.co/storage/v1/object/%'
ORDER BY created_at DESC;
