-- Fix existing tracks that have file paths instead of public URLs
-- This script converts file paths to public URLs for existing tracks

-- First, let's see what we're working with
SELECT 
  id,
  title,
  audio_url,
  image_url,
  created_at
FROM tracks 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if any tracks have file paths (not URLs)
SELECT 
  id,
  title,
  audio_url,
  CASE 
    WHEN audio_url LIKE 'https://%' THEN 'URL'
    WHEN audio_url LIKE '%/%' THEN 'FILE_PATH'
    ELSE 'UNKNOWN'
  END as audio_url_type,
  image_url,
  CASE 
    WHEN image_url LIKE 'https://%' THEN 'URL'
    WHEN image_url LIKE '%/%' THEN 'FILE_PATH'
    ELSE 'UNKNOWN'
  END as image_url_type
FROM tracks 
ORDER BY created_at DESC 
LIMIT 10;

-- Note: To fix existing tracks, you would need to:
-- 1. Identify tracks with file paths
-- 2. Convert them to public URLs using the getPublicUrl function
-- 3. Update the database

-- Example of how to update a specific track (replace with actual values):
-- UPDATE tracks 
-- SET audio_url = 'https://your-project.supabase.co/storage/v1/object/public/track-audio/path/to/file.mp3'
-- WHERE id = 'track-id-here';

-- For now, let's just see what needs to be fixed
SELECT 
  COUNT(*) as total_tracks,
  COUNT(CASE WHEN audio_url NOT LIKE 'https://%' THEN 1 END) as tracks_with_file_paths,
  COUNT(CASE WHEN audio_url LIKE 'https://%' THEN 1 END) as tracks_with_urls
FROM tracks; 