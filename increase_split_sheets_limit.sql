-- Increase file size limit for split-sheets bucket
-- Current limit: 10MB (10485760 bytes)
-- New limit: 50MB (52428800 bytes) - same as track-audio

UPDATE storage.buckets 
SET file_size_limit = 52428800
WHERE id = 'split-sheets';

-- Verify the change
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'split-sheets'; 