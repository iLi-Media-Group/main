-- Create services-images bucket for storing service images
-- This bucket will store images for studios, engineers, and artists

-- Create services-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'services-images',
  'services-images',
  true,  -- Public bucket so services can display images
  10485760,  -- 10MB limit for service images
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

-- Create RLS policies for services-images bucket
-- Allow admins to upload service images
DROP POLICY IF EXISTS "Admins can upload service images" ON storage.objects;
CREATE POLICY "Admins can upload service images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'services-images' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type IN ('admin', 'admin,producer')
  )
);

-- Allow admins to view service images
DROP POLICY IF EXISTS "Admins can view service images" ON storage.objects;
CREATE POLICY "Admins can view service images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'services-images' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type IN ('admin', 'admin,producer')
  )
);

-- Allow admins to update service images
DROP POLICY IF EXISTS "Admins can update service images" ON storage.objects;
CREATE POLICY "Admins can update service images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'services-images' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type IN ('admin', 'admin,producer')
  )
);

-- Allow admins to delete service images
DROP POLICY IF EXISTS "Admins can delete service images" ON storage.objects;
CREATE POLICY "Admins can delete service images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'services-images' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type IN ('admin', 'admin,producer')
  )
);

-- Allow public read access to service images
DROP POLICY IF EXISTS "Public can view service images" ON storage.objects;
CREATE POLICY "Public can view service images" ON storage.objects
FOR SELECT USING (bucket_id = 'services-images');

-- Verify the bucket was created
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types 
FROM storage.buckets 
WHERE id = 'services-images'; 