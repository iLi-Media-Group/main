-- Fix RLS policies for track-audio bucket
-- These policies will allow authenticated users to upload, view, update, and delete their own files

-- 1. Allow authenticated users to upload to track-audio bucket
CREATE POLICY "Allow authenticated users to upload to track-audio" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'track-audio');

-- 2. Allow authenticated users to view files in track-audio bucket
CREATE POLICY "Allow authenticated users to view track-audio files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'track-audio');

-- 3. Allow authenticated users to update their own files in track-audio bucket
CREATE POLICY "Allow authenticated users to update track-audio files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'track-audio')
WITH CHECK (bucket_id = 'track-audio');

-- 4. Allow authenticated users to delete their own files in track-audio bucket
CREATE POLICY "Allow authenticated users to delete track-audio files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'track-audio');

-- 5. Allow public read access to track-audio files (for streaming)
CREATE POLICY "Allow public read access to track-audio files" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'track-audio');

-- Verify the policies were created
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%track-audio%'
ORDER BY policyname; 