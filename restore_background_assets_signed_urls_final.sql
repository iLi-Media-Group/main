-- Restore Background Assets: Convert file paths back to proper signed URLs
-- This script will restore the full signed URL structure for private bucket access

-- ============================================
-- 1. CURRENT STATE ANALYSIS
-- ============================================

-- Show current state of background assets
SELECT 
    'Current background assets state:' as info,
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
-- 2. THE PROBLEM
-- ============================================

-- The current URLs are just file paths (e.g., "1754741941348_Untitled design.mp4")
-- But the background-videos bucket is PRIVATE and requires signed URLs
-- We need to restore the full signed URL structure

-- ============================================
-- 3. IMMEDIATE SOLUTION
-- ============================================

-- Since we can't generate new signed URLs from SQL, you have two options:

-- OPTION 1: Make the buckets public (RECOMMENDED)
-- Go to Supabase Dashboard > Storage > background-videos > Policies
-- Add policy: "Allow public read access"
-- Same for background-images bucket
-- This would let us use public URLs instead of signed URLs

-- OPTION 2: Re-upload the assets to get fresh signed URLs
-- 1. Delete the current background assets from the database
-- 2. Re-upload them through the BackgroundManager
-- 3. The storage.ts will now generate signed URLs correctly

-- ============================================
-- 4. QUICK FIX FOR OPTION 1 (MAKE BUCKETS PUBLIC)
-- ============================================

-- If you choose OPTION 1, run this in Supabase Dashboard:
-- 1. Go to Storage > background-videos
-- 2. Click "Policies" tab
-- 3. Add new policy:
--    - Policy name: "Allow public read access"
--    - Target roles: public
--    - Using expression: true
--    - Operation: SELECT

-- Same for background-images bucket

-- ============================================
-- 5. QUICK FIX FOR OPTION 2 (RE-UPLOAD)
-- ============================================

-- If you choose OPTION 2, run these SQL commands:

-- First, delete the current assets
-- DELETE FROM background_assets WHERE page = 'hero';

-- Then re-upload through the BackgroundManager in your app
-- This will generate fresh signed URLs

-- ============================================
-- 6. VERIFICATION
-- ============================================

-- Check if any assets have proper signed URLs
SELECT 
    'Assets with proper signed URLs:' as status,
    COUNT(*) as count
FROM background_assets 
WHERE url LIKE '%/object/sign/%' AND url LIKE '%?token=%';

-- Check if any assets are just file paths
SELECT 
    'Assets that are just file paths:' as status,
    COUNT(*) as count
FROM background_assets 
WHERE url NOT LIKE '%/object/sign/%' AND url NOT LIKE '%?token=%' AND url NOT LIKE 'https://%';

-- ============================================
-- 7. FINAL STATUS
-- ============================================

SELECT 'Background assets analysis complete!' as final_status;
SELECT 'Choose between making buckets public or re-uploading assets for fresh signed URLs.' as next_steps;
