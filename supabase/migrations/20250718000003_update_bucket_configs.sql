-- Update existing buckets with proper configuration
-- This migration fixes the null values in existing buckets

-- Update track-audio bucket
UPDATE storage.buckets 
SET 
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav']
WHERE id = 'track-audio';

-- Update track-images bucket
UPDATE storage.buckets 
SET 
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'track-images';

-- Update split-sheets bucket
UPDATE storage.buckets 
SET 
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png']
WHERE id = 'split-sheets';

-- Update trackouts bucket (500MB for large archive files)
UPDATE storage.buckets 
SET 
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'application/zip', 'application/x-rar-compressed', 'application/vnd.rar']
WHERE id = 'trackouts';

-- Update stems bucket (500MB for large archive files)
UPDATE storage.buckets 
SET 
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'application/zip', 'application/x-rar-compressed', 'application/vnd.rar']
WHERE id = 'stems';

-- Add RLS policies for track-audio bucket
DROP POLICY IF EXISTS "Producers can upload audio files" ON storage.objects;
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

DROP POLICY IF EXISTS "Producers can view their audio files" ON storage.objects;
CREATE POLICY "Producers can view their audio files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'track-audio' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Producers can delete their audio files" ON storage.objects;
CREATE POLICY "Producers can delete their audio files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'track-audio' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Add RLS policies for track-images bucket
DROP POLICY IF EXISTS "Producers can upload image files" ON storage.objects;
CREATE POLICY "Producers can upload image files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'track-images' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'producer'
  )
);

DROP POLICY IF EXISTS "Producers can view their image files" ON storage.objects;
CREATE POLICY "Producers can view their image files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'track-images' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Producers can delete their image files" ON storage.objects;
CREATE POLICY "Producers can delete their image files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'track-images' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Add RLS policies for split-sheets bucket
DROP POLICY IF EXISTS "Producers can upload split sheet files" ON storage.objects;
CREATE POLICY "Producers can upload split sheet files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'split-sheets' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'producer'
  )
);

DROP POLICY IF EXISTS "Producers can view their split sheet files" ON storage.objects;
CREATE POLICY "Producers can view their split sheet files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'split-sheets' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Producers can delete their split sheet files" ON storage.objects;
CREATE POLICY "Producers can delete their split sheet files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'split-sheets' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Add RLS policies for trackouts bucket
DROP POLICY IF EXISTS "Producers can upload trackout files" ON storage.objects;
CREATE POLICY "Producers can upload trackout files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'trackouts' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'producer'
  )
);

DROP POLICY IF EXISTS "Producers can view their trackout files" ON storage.objects;
CREATE POLICY "Producers can view their trackout files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'trackouts' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Producers can delete their trackout files" ON storage.objects;
CREATE POLICY "Producers can delete their trackout files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'trackouts' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Add RLS policies for stems bucket
DROP POLICY IF EXISTS "Producers can upload stem files" ON storage.objects;
CREATE POLICY "Producers can upload stem files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'stems' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'producer'
  )
);

DROP POLICY IF EXISTS "Producers can view their stem files" ON storage.objects;
CREATE POLICY "Producers can view their stem files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'stems' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Producers can delete their stem files" ON storage.objects;
CREATE POLICY "Producers can delete their stem files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'stems' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
); 