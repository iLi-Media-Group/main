-- Fix storage bucket policies for track uploads
-- This script checks and fixes permissions for track-related storage buckets

-- Check existing storage buckets
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name IN ('track-audio', 'track-images', 'trackouts', 'stems', 'split-sheets');

-- Check existing storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename LIKE 'storage.objects'
ORDER BY policyname;

-- Drop existing storage policies that might be conflicting
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public files are viewable by everyone" ON storage.objects;

-- Create comprehensive storage policies
CREATE POLICY "Users can upload their own files" ON storage.objects
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = ANY (ARRAY['producer', 'admin', 'admin,producer'])
    )
  );

CREATE POLICY "Users can view their own files" ON storage.objects
  FOR SELECT
  USING (
    auth.uid()::text = (storage.foldername(name))[1]
    OR bucket_id IN ('track-images', 'track-audio') -- Allow public access to track files
  );

CREATE POLICY "Users can update their own files" ON storage.objects
  FOR UPDATE
  USING (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = ANY (ARRAY['producer', 'admin', 'admin,producer'])
    )
  );

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE
  USING (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = ANY (ARRAY['producer', 'admin', 'admin,producer'])
    )
  );

-- Make track-images bucket public for viewing
UPDATE storage.buckets 
SET public = true 
WHERE name = 'track-images';

-- Make track-audio bucket public for viewing
UPDATE storage.buckets 
SET public = true 
WHERE name = 'track-audio';

-- Verify the changes
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name IN ('track-audio', 'track-images', 'trackouts', 'stems', 'split-sheets');

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'storage.objects'
ORDER BY policyname; 