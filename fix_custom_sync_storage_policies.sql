-- Fix storage bucket RLS policies for custom sync uploads
-- This script uses a simpler approach that works with Supabase's storage system

-- First, let's check what storage buckets exist
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id IN ('track-audio', 'trackouts', 'stems', 'split-sheets')
ORDER BY name;

-- Check existing storage policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- Create a simpler approach: Allow authenticated users to upload to these buckets
-- This is more permissive but will work for custom sync uploads

-- Drop any existing conflicting policies for these buckets
DROP POLICY IF EXISTS "Allow authenticated uploads to custom sync buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated downloads from custom sync buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletions from custom sync buckets" ON storage.objects;

-- Create a policy that allows authenticated users to upload to the custom sync buckets
CREATE POLICY "Allow authenticated uploads to custom sync buckets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id IN ('track-audio', 'trackouts', 'stems', 'split-sheets') AND 
  auth.role() = 'authenticated'
);

-- Create a policy that allows authenticated users to view files in these buckets
CREATE POLICY "Allow authenticated downloads from custom sync buckets" ON storage.objects
FOR SELECT USING (
  bucket_id IN ('track-audio', 'trackouts', 'stems', 'split-sheets') AND 
  auth.role() = 'authenticated'
);

-- Create a policy that allows authenticated users to delete files in these buckets
CREATE POLICY "Allow authenticated deletions from custom sync buckets" ON storage.objects
FOR DELETE USING (
  bucket_id IN ('track-audio', 'trackouts', 'stems', 'split-sheets') AND 
  auth.role() = 'authenticated'
);

-- Verify the policies were created
SELECT 
  policyname,
  permissive,
  roles,
  cmd
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
