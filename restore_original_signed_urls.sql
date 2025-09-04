-- Restore original signed URLs for background assets
-- This reconstructs the signed URLs from the file paths

-- ============================================
-- 1. RESTORE SIGNED URLS FOR BACKGROUND VIDEOS
-- ============================================

-- Convert file paths back to signed URLs for background-videos
UPDATE background_assets
SET url = 'https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/sign/background-videos/' || url
WHERE type = 'video' 
  AND url NOT LIKE 'https://%'
  AND url NOT LIKE '%/object/sign/%';

-- ============================================
-- 2. RESTORE SIGNED URLS FOR BACKGROUND IMAGES
-- ============================================

-- Convert file paths back to signed URLs for background-images
UPDATE background_assets
SET url = 'https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/sign/background-images/' || url
WHERE type = 'image' 
  AND url NOT LIKE 'https://%'
  AND url NOT LIKE '%/object/sign/%';

-- ============================================
-- 3. VERIFICATION
-- ============================================

-- Show the updated background assets
SELECT 
    'Updated background assets:' as info,
    id,
    name,
    url,
    type,
    page,
    "isActive",
    created_at
FROM background_assets 
ORDER BY page, created_at DESC;

-- ============================================
-- 4. FINAL STATUS
-- ============================================

SELECT 'Background assets signed URLs restored!' as final_status;
SELECT 'The VideoBackground and HeroSection components should now work with the restored signed URLs.' as next_steps;
