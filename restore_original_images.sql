-- Restore original image URLs for tracks that had actual uploaded images
-- We need to revert the changes for tracks that had simple filenames but were actual uploads

-- First, let's see what we have now
SELECT 
  id,
  title,
  image_url,
  created_at
FROM tracks 
WHERE image_url LIKE 'https://images.unsplash.com%'
ORDER BY created_at DESC;

-- For tracks that were uploaded before the folder structure change,
-- we need to check if they have actual images in storage
-- For now, let's set them back to their original simple filenames
-- and let the signed URL system handle them

-- This is a temporary fix - we'll need to check the actual storage bucket
-- to see what images exist and restore them properly

-- For demonstration, let's assume these tracks had actual images:
-- "Winning - test upload only" and "Test Track 2"

-- We'll need to manually check what the original filenames were
-- and restore them if the files still exist in storage 