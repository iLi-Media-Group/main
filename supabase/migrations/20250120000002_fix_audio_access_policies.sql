-- Fix audio access policies that are too restrictive
-- This migration allows producers to access their audio files regardless of folder structure

-- Drop the restrictive policies
DROP POLICY IF EXISTS "Producers can view their audio files" ON storage.objects;
DROP POLICY IF EXISTS "Producers can view their image files" ON storage.objects;

-- Create more permissive policies for audio and image access
CREATE POLICY "Producers can view audio files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'track-audio' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'producer'
  )
);

CREATE POLICY "Producers can view image files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'track-images' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'producer'
  )
);

-- Also allow admins to view all audio and image files
CREATE POLICY "Admins can view all audio files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'track-audio' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'admin'
  )
);

CREATE POLICY "Admins can view all image files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'track-images' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'admin'
  )
); 