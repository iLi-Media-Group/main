-- Create service-images storage bucket
-- This script creates the missing service-images bucket needed for service image uploads

-- Create service-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images', 
  'service-images', 
  true,  -- Public bucket so services page can display images
  5242880,  -- 5MB limit for service images
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admins can upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view service images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update service images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete service images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view service images" ON storage.objects;

-- Create RLS policies for service-images bucket
-- Allow admins to upload service images
CREATE POLICY "Admins can upload service images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'service-images' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type IN ('admin', 'admin,producer')
  )
);

-- Allow admins to view service images
CREATE POLICY "Admins can view service images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'service-images' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type IN ('admin', 'admin,producer')
  )
);

-- Allow admins to update service images
CREATE POLICY "Admins can update service images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'service-images' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type IN ('admin', 'admin,producer')
  )
);

-- Allow admins to delete service images
CREATE POLICY "Admins can delete service images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'service-images' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type IN ('admin', 'admin,producer')
  )
);

-- Allow public read access to service images (needed for services page)
CREATE POLICY "Public can view service images" ON storage.objects
FOR SELECT USING (bucket_id = 'service-images');

-- Verify the bucket was created
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets 
WHERE id = 'service-images';

-- Show all policies for service-images bucket
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'storage.objects' 
AND policyname LIKE '%service images%'
ORDER BY policyname;
