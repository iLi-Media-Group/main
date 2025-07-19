-- Fix track upload buckets and RLS policies
-- This migration ensures all necessary buckets exist with proper permissions

-- Create track-audio bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('track-audio', 'track-audio', false, 52428800, ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav'])
ON CONFLICT (id) DO NOTHING;

-- Create track-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('track-images', 'track-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create split-sheets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('split-sheets', 'split-sheets', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Create trackouts bucket if it doesn't exist (500MB for large archive files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('trackouts', 'trackouts', false, 524288000, ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'application/zip', 'application/x-rar-compressed', 'application/vnd.rar'])
ON CONFLICT (id) DO NOTHING;

-- Create stems bucket if it doesn't exist (500MB for large archive files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('stems', 'stems', false, 524288000, ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'application/zip', 'application/x-rar-compressed', 'application/vnd.rar'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for track-audio bucket
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

-- RLS Policies for track-images bucket
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

-- RLS Policies for split-sheets bucket
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

-- RLS Policies for trackouts bucket
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

-- RLS Policies for stems bucket
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