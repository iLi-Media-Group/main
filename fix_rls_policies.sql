-- Add RLS policies for track-audio bucket
-- This ensures producers can upload to the bucket

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Producers can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Producers can view their audio files" ON storage.objects;
DROP POLICY IF EXISTS "Producers can delete their audio files" ON storage.objects;

-- Create upload policy
CREATE POLICY "Producers can upload audio files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'track-audio' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'producer'
  )
);

-- Create view policy
CREATE POLICY "Producers can view their audio files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'track-audio' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create delete policy
CREATE POLICY "Producers can delete their audio files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'track-audio' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'; 