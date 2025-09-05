-- Fix double URL issue in tracks table
-- This script extracts just the file path from URLs that contain full signed URLs

-- First, let's see what we're working with
SELECT 
  id,
  title,
  audio_url,
  CASE 
    WHEN audio_url LIKE 'https://%.supabase.co/storage/v1/object/sign/track-audio/https://%' THEN 'DOUBLE_URL'
    WHEN audio_url LIKE 'https://%' THEN 'SINGLE_URL'
    WHEN audio_url LIKE '%/%' THEN 'FILE_PATH'
    ELSE 'UNKNOWN'
  END as audio_url_type
FROM tracks 
WHERE audio_url IS NOT NULL
ORDER BY created_at DESC 
LIMIT 10;

-- Fix tracks that have double URLs (full signed URLs stored as paths)
UPDATE tracks 
SET audio_url = 
  CASE 
    -- Extract file path from double URL pattern: https://project.supabase.co/storage/v1/object/sign/track-audio/https://project.supabase.co/storage/v1/object/sign/track-audio/path/to/file.mp3
    WHEN audio_url LIKE 'https://%.supabase.co/storage/v1/object/sign/track-audio/https://%.supabase.co/storage/v1/object/sign/track-audio/%' 
    THEN SUBSTRING(audio_url FROM 'track-audio/(.+)$')
    
    -- Extract file path from single signed URL pattern: https://project.supabase.co/storage/v1/object/sign/track-audio/path/to/file.mp3
    WHEN audio_url LIKE 'https://%.supabase.co/storage/v1/object/sign/track-audio/%' 
    THEN SUBSTRING(audio_url FROM 'track-audio/(.+)$')
    
    -- Extract file path from public URL pattern: https://project.supabase.co/storage/v1/object/public/track-audio/path/to/file.mp3
    WHEN audio_url LIKE 'https://%.supabase.co/storage/v1/object/public/track-audio/%' 
    THEN SUBSTRING(audio_url FROM 'track-audio/(.+)$')
    
    -- Keep as is if it's already a file path
    ELSE audio_url
  END
WHERE audio_url LIKE 'https://%';

-- Also fix image_url if it has the same issue
UPDATE tracks 
SET image_url = 
  CASE 
    -- Extract file path from double URL pattern for images
    WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/sign/track-images/https://%.supabase.co/storage/v1/object/sign/track-images/%' 
    THEN SUBSTRING(image_url FROM 'track-images/(.+)$')
    
    -- Extract file path from single signed URL pattern for images
    WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/sign/track-images/%' 
    THEN SUBSTRING(image_url FROM 'track-images/(.+)$')
    
    -- Extract file path from public URL pattern for images
    WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/public/track-images/%' 
    THEN SUBSTRING(image_url FROM 'track-images/(.+)$')
    
    -- Keep as is if it's already a file path or a public URL (like Unsplash)
    ELSE image_url
  END
WHERE image_url LIKE 'https://%.supabase.co/storage/v1/object/%';

-- Verify the changes
SELECT 
  id,
  title,
  audio_url,
  CASE 
    WHEN audio_url LIKE 'https://%.supabase.co/storage/v1/object/sign/track-audio/https://%' THEN 'DOUBLE_URL'
    WHEN audio_url LIKE 'https://%' THEN 'SINGLE_URL'
    WHEN audio_url LIKE '%/%' THEN 'FILE_PATH'
    ELSE 'UNKNOWN'
  END as audio_url_type
FROM tracks 
WHERE audio_url IS NOT NULL
ORDER BY created_at DESC 
LIMIT 10; 