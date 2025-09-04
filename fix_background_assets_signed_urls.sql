-- Fix Background Assets: Convert signed URLs to public URLs for public bucket access
-- This script will clean up existing signed URLs in the background_assets table

-- ============================================
-- 1. CONVERT SIGNED URLS TO PUBLIC URLS
-- ============================================

-- Convert signed URLs to public URLs for background-videos bucket
UPDATE background_assets
SET url = regexp_replace(url, '/object/sign/background-videos/', '/object/public/background-videos/')
WHERE url LIKE '%/object/sign/background-videos/%';

-- Convert signed URLs to public URLs for background-images bucket
UPDATE background_assets
SET url = regexp_replace(url, '/object/sign/background-images/', '/object/public/background-images/')
WHERE url LIKE '%/object/sign/background-images/%';

-- ============================================
-- 2. REMOVE TOKEN PARAMETERS FROM URLS
-- ============================================

-- Remove token parameters from URLs
UPDATE background_assets
SET url = regexp_replace(url, '\?token=.*$', '')
WHERE url LIKE '%?token=%';

-- ============================================
-- 3. CONVERT FULL SIGNED URLS TO FILE PATHS
-- ============================================

-- Convert full signed URLs to just file paths for background-videos
UPDATE background_assets
SET url = regexp_replace(url, '^https://[^/]+/storage/v1/object/public/background-videos/', '')
WHERE url LIKE '%/object/public/background-videos/%';

-- Convert full signed URLs to just file paths for background-images
UPDATE background_assets
SET url = regexp_replace(url, '^https://[^/]+/storage/v1/object/public/background-images/', '')
WHERE url LIKE '%/object/public/background-images/%';

-- ============================================
-- 4. VERIFICATION QUERIES
-- ============================================

-- Show the current state of background assets
SELECT 
    id,
    name,
    url,
    type,
    page,
    "isActive",
    created_at
FROM background_assets 
ORDER BY page, created_at DESC;

-- Check for any remaining signed URLs
SELECT 
    'Remaining signed URLs found:' as status,
    COUNT(*) as count
FROM background_assets 
WHERE url LIKE '%/object/sign/%' OR url LIKE '%?token=%';

-- Show sample of fixed URLs
SELECT 
    'Sample of fixed URLs:' as info,
    page,
    url,
    type
FROM background_assets 
WHERE url NOT LIKE '%/object/sign/%' AND url NOT LIKE '%?token=%'
LIMIT 5;

-- ============================================
-- 5. FINAL STATUS
-- ============================================

SELECT 'Background assets signed URL fix complete!' as final_status;
SELECT 'The VideoBackground and HeroSection components should now work with public URLs.' as next_steps;
