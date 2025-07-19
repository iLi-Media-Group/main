-- Fix audio_urls: Convert public URLs back to file paths
-- This script extracts just the filename from the public URL

-- First, let's see what we're working with
SELECT 
  id,
  title,
  audio_url,
  CASE 
    WHEN audio_url LIKE 'https://%' THEN 'PUBLIC_URL'
    WHEN audio_url LIKE '%/%' THEN 'FILE_PATH'
    ELSE 'SIMPLE_FILENAME'
  END as audio_url_type
FROM tracks 
ORDER BY created_at DESC 
LIMIT 10;

-- Update tracks that have public URLs to use just the filename
UPDATE tracks 
SET audio_url = 
  CASE 
    -- Extract filename from public URL pattern: https://project.supabase.co/storage/v1/object/public/track-audio/filename.mp3
    WHEN audio_url LIKE 'https://%.supabase.co/storage/v1/object/public/track-audio/%' 
    THEN SUBSTRING(audio_url FROM 'track-audio/([^/]+)$')
    
    -- Extract filename from public URL pattern: https://project.supabase.co/storage/v1/object/public/track-audio/user-id/track-title/filename.mp3
    WHEN audio_url LIKE 'https://%.supabase.co/storage/v1/object/public/track-audio/%/%' 
    THEN SUBSTRING(audio_url FROM 'track-audio/(.+)$')
    
    -- Keep as is if it's already a file path or simple filename
    ELSE audio_url
  END
WHERE audio_url LIKE 'https://%';

-- Verify the changes
SELECT 
  id,
  title,
  audio_url,
  CASE 
    WHEN audio_url LIKE 'https://%' THEN 'PUBLIC_URL'
    WHEN audio_url LIKE '%/%' THEN 'FILE_PATH'
    ELSE 'SIMPLE_FILENAME'
  END as audio_url_type
FROM tracks 
ORDER BY created_at DESC 
LIMIT 10; 