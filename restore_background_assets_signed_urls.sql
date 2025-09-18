-- Restore Background Assets: Convert file paths back to signed URLs for private bucket access
-- This script will restore signed URLs since background-videos and background-images are private buckets

-- ============================================
-- 1. CONVERT FILE PATHS BACK TO SIGNED URLS
-- ============================================

-- For background-videos, we need to restore the full signed URL structure
-- Since we can't generate new signed URLs from SQL, we'll need to update the upload logic
-- For now, let's check what we have and prepare for the correct approach

-- Show current state
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
-- 2. RECOMMENDATION
-- ============================================

-- The background-videos and background-images buckets are private and require signed URLs
-- You have two options:

-- OPTION 1: Make the buckets public (recommended for background assets)
-- Run this in Supabase Dashboard > Storage > Policies:
-- Set bucket policy to allow public read access

-- OPTION 2: Keep buckets private and ensure uploads generate signed URLs
-- The storage.ts file has been updated to generate signed URLs for these buckets
-- You may need to re-upload the background assets to get fresh signed URLs

-- ============================================
-- 3. IMMEDIATE FIX
-- ============================================

-- If you want to make the buckets public (OPTION 1), run this:
-- Go to Supabase Dashboard > Storage > background-videos > Policies
-- Add policy: "Allow public read access"
-- Same for background-images bucket

-- If you want to keep private (OPTION 2), you'll need to:
-- 1. Delete the current background assets
-- 2. Re-upload them to get fresh signed URLs
-- 3. The storage.ts will now generate signed URLs correctly

-- ============================================
-- 4. VERIFICATION
-- ============================================

-- Check if any assets have expired signed URLs
SELECT 
    'Assets with potentially expired URLs:' as status,
    COUNT(*) as count
FROM background_assets 
WHERE url LIKE '%token=%' AND created_at < NOW() - INTERVAL '1 year';

-- Show sample of current URLs
SELECT 
    'Sample of current URLs:' as info,
    page,
    url,
    type,
    created_at
FROM background_assets 
LIMIT 5;

-- ============================================
-- 5. FINAL STATUS
-- ============================================

SELECT 'Background assets analysis complete!' as final_status;
SELECT 'Choose between making buckets public or re-uploading assets for fresh signed URLs.' as next_steps;
