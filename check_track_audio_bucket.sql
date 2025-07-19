-- Check if track-audio bucket exists and show its details
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets 
WHERE id = 'track-audio';

-- Show all buckets for comparison
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
ORDER BY name;

-- Check if there are any files in the track-audio bucket
SELECT 
  name,
  bucket_id,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
FROM storage.objects 
WHERE bucket_id = 'track-audio'
ORDER BY created_at DESC
LIMIT 10; 