-- Fix storage bucket RLS policies for custom sync uploads
-- This script adds policies to allow producers to upload files to custom_syncs folders

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for custom sync uploads to track-audio bucket
DROP POLICY IF EXISTS "Producers can upload custom sync audio files" ON storage.objects;
CREATE POLICY "Producers can upload custom sync audio files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'track-audio' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'producer'
  ) AND
  (storage.foldername(name))[1] = 'custom_syncs'
);

DROP POLICY IF EXISTS "Producers can view custom sync audio files" ON storage.objects;
CREATE POLICY "Producers can view custom sync audio files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'track-audio' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'custom_syncs'
);

DROP POLICY IF EXISTS "Producers can delete custom sync audio files" ON storage.objects;
CREATE POLICY "Producers can delete custom sync audio files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'track-audio' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'custom_syncs'
);

-- Add RLS policies for custom sync uploads to trackouts bucket
DROP POLICY IF EXISTS "Producers can upload custom sync trackout files" ON storage.objects;
CREATE POLICY "Producers can upload custom sync trackout files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'trackouts' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'producer'
  ) AND
  (storage.foldername(name))[1] = 'custom_syncs'
);

DROP POLICY IF EXISTS "Producers can view custom sync trackout files" ON storage.objects;
CREATE POLICY "Producers can view custom sync trackout files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'trackouts' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'custom_syncs'
);

DROP POLICY IF EXISTS "Producers can delete custom sync trackout files" ON storage.objects;
CREATE POLICY "Producers can delete custom sync trackout files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'trackouts' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'custom_syncs'
);

-- Add RLS policies for custom sync uploads to stems bucket
DROP POLICY IF EXISTS "Producers can upload custom sync stem files" ON storage.objects;
CREATE POLICY "Producers can upload custom sync stem files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'stems' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'producer'
  ) AND
  (storage.foldername(name))[1] = 'custom_syncs'
);

DROP POLICY IF EXISTS "Producers can view custom sync stem files" ON storage.objects;
CREATE POLICY "Producers can view custom sync stem files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'stems' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'custom_syncs'
);

DROP POLICY IF EXISTS "Producers can delete custom sync stem files" ON storage.objects;
CREATE POLICY "Producers can delete custom sync stem files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'stems' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'custom_syncs'
);

-- Add RLS policies for custom sync uploads to split-sheets bucket
DROP POLICY IF EXISTS "Producers can upload custom sync split sheet files" ON storage.objects;
CREATE POLICY "Producers can upload custom sync split sheet files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'split-sheets' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'producer'
  ) AND
  (storage.foldername(name))[1] = 'custom_syncs'
);

DROP POLICY IF EXISTS "Producers can view custom sync split sheet files" ON storage.objects;
CREATE POLICY "Producers can view custom sync split sheet files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'split-sheets' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'custom_syncs'
);

DROP POLICY IF EXISTS "Producers can delete custom sync split sheet files" ON storage.objects;
CREATE POLICY "Producers can delete custom sync split sheet files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'split-sheets' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'custom_syncs'
);

-- Also add policies for clients to view custom sync files (for downloads)
DROP POLICY IF EXISTS "Clients can view custom sync files" ON storage.objects;
CREATE POLICY "Clients can view custom sync files" ON storage.objects
FOR SELECT USING (
  bucket_id IN ('track-audio', 'trackouts', 'stems', 'split-sheets') AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'custom_syncs' AND
  EXISTS (
    SELECT 1 FROM custom_sync_requests csr
    JOIN profiles p ON csr.client_id = p.id
    WHERE p.id = auth.uid() 
    AND csr.id::text = (storage.foldername(name))[2]
  )
);

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
  AND policyname LIKE '%custom sync%'
ORDER BY policyname;

-- Show all storage policies for reference
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;
