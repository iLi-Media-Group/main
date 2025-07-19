-- Fix bucket security - make track-related buckets private
-- Run this immediately to secure your files

-- Make track-audio private
UPDATE storage.buckets 
SET public = false
WHERE id = 'track-audio';

-- Make track-images private  
UPDATE storage.buckets 
SET public = false
WHERE id = 'track-images';

-- Make split-sheets private
UPDATE storage.buckets 
SET public = false
WHERE id = 'split-sheets';

-- Make trackouts private
UPDATE storage.buckets 
SET public = false
WHERE id = 'trackouts';

-- Make stems private
UPDATE storage.buckets 
SET public = false
WHERE id = 'stems';

-- Verify the changes
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('track-audio', 'track-images', 'split-sheets', 'trackouts', 'stems')
ORDER BY name; 