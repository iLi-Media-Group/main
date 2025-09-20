-- Fix Background Assets: Decode URL-encoded characters in file paths
-- This script will decode %20 and other URL-encoded characters to proper file names

-- ============================================
-- 1. DECODE URL-ENCODED CHARACTERS
-- ============================================

-- Decode %20 to spaces
UPDATE background_assets
SET url = regexp_replace(url, '%20', ' ', 'g')
WHERE url LIKE '%20%';

-- Decode other common URL-encoded characters
UPDATE background_assets
SET url = regexp_replace(url, '%2F', '/', 'g')
WHERE url LIKE '%2F%';

UPDATE background_assets
SET url = regexp_replace(url, '%2B', '+', 'g')
WHERE url LIKE '%2B%';

UPDATE background_assets
SET url = regexp_replace(url, '%3D', '=', 'g')
WHERE url LIKE '%3D%';

UPDATE background_assets
SET url = regexp_replace(url, '%26', '&', 'g')
WHERE url LIKE '%26%';

UPDATE background_assets
SET url = regexp_replace(url, '%3F', '?', 'g')
WHERE url LIKE '%3F%';

-- ============================================
-- 2. VERIFICATION QUERIES
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

-- Check for any remaining URL-encoded characters
SELECT 
    'Remaining URL-encoded characters found:' as status,
    COUNT(*) as count
FROM background_assets 
WHERE url LIKE '%20%' OR url LIKE '%2F%' OR url LIKE '%2B%' OR url LIKE '%3D%' OR url LIKE '%26%' OR url LIKE '%3F%';

-- Show sample of fixed URLs
SELECT 
    'Sample of fixed URLs:' as info,
    page,
    url,
    type
FROM background_assets 
WHERE url NOT LIKE '%20%' AND url NOT LIKE '%2F%' AND url NOT LIKE '%2B%' AND url NOT LIKE '%3D%' AND url NOT LIKE '%26%' AND url NOT LIKE '%3F%'
LIMIT 5;

-- ============================================
-- 3. FINAL STATUS
-- ============================================

SELECT 'Background assets URL decoding complete!' as final_status;
SELECT 'The VideoBackground and HeroSection components should now work with properly decoded file names.' as next_steps;
