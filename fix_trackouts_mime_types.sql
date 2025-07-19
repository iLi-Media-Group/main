-- Add comprehensive MIME types for archive files in trackouts and stems buckets
-- This covers various archive formats producers might use to bundle their files

UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  -- Standard ZIP formats
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  
  -- RAR formats
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/rar',
  
  -- 7-Zip formats
  'application/x-7z-compressed',
  'application/7z',
  
  -- TAR formats
  'application/x-tar',
  'application/tar',
  
  -- GZIP formats
  'application/gzip',
  'application/x-gzip',
  
  -- Generic archive formats
  'application/octet-stream',
  'application/x-binary'
]
WHERE id = 'trackouts';

-- Also update stems bucket to be consistent
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  -- Standard ZIP formats
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  
  -- RAR formats
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/rar',
  
  -- 7-Zip formats
  'application/x-7z-compressed',
  'application/7z',
  
  -- TAR formats
  'application/x-tar',
  'application/tar',
  
  -- GZIP formats
  'application/gzip',
  'application/x-gzip',
  
  -- Generic archive formats
  'application/octet-stream',
  'application/x-binary'
]
WHERE id = 'stems';

-- Verify the changes
SELECT 
  id,
  name,
  allowed_mime_types
FROM storage.buckets 
WHERE id IN ('trackouts', 'stems')
ORDER BY name; 