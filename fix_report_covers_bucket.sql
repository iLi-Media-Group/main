-- Fix Report Covers Storage Bucket
-- This script creates the missing report-covers bucket needed for report cover sheets

-- Create report-covers bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-covers', 
  'report-covers', 
  true,  -- Public bucket so reports can access cover images
  10485760,  -- 10MB limit for cover images
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

-- Create RLS policies for report-covers bucket
-- Allow admins to upload cover images
DROP POLICY IF EXISTS "Admins can upload report covers" ON storage.objects;
CREATE POLICY "Admins can upload report covers" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'report-covers' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type IN ('admin', 'admin,producer')
  )
);

-- Allow admins to view report covers
DROP POLICY IF EXISTS "Admins can view report covers" ON storage.objects;
CREATE POLICY "Admins can view report covers" ON storage.objects
FOR SELECT USING (
  bucket_id = 'report-covers' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type IN ('admin', 'admin,producer')
  )
);

-- Allow admins to update report covers
DROP POLICY IF EXISTS "Admins can update report covers" ON storage.objects;
CREATE POLICY "Admins can update report covers" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'report-covers' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type IN ('admin', 'admin,producer')
  )
);

-- Allow admins to delete report covers
DROP POLICY IF EXISTS "Admins can delete report covers" ON storage.objects;
CREATE POLICY "Admins can delete report covers" ON storage.objects
FOR DELETE USING (
  bucket_id = 'report-covers' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type IN ('admin', 'admin,producer')
  )
);

-- Verify the bucket was created
SELECT '=== REPORT COVERS BUCKET STATUS ===' as info;
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets 
WHERE id = 'report-covers';

-- Show all buckets to confirm it's in the list
SELECT '=== ALL STORAGE BUCKETS ===' as info;
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
ORDER BY name;

-- Check RLS policies for report-covers
SELECT '=== REPORT COVERS RLS POLICIES ===' as info;
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%report covers%'
ORDER BY policyname; 