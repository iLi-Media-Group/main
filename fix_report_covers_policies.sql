-- Fix Report Covers RLS Policies
-- This script fixes the RLS policies for the existing report-covers bucket

-- First, let's check the current bucket configuration
SELECT '=== CURRENT BUCKET CONFIG ===' as info;
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'report-covers';

-- Update bucket to ensure it's public (needed for report access)
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'],
  updated_at = NOW()
WHERE id = 'report-covers';

-- Drop any existing policies for report-covers to start fresh
DROP POLICY IF EXISTS "Admins can upload report covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view report covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update report covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete report covers" ON storage.objects;
DROP POLICY IF EXISTS "Public can view report covers" ON storage.objects;

-- Create comprehensive RLS policies for report-covers bucket
-- Allow admins to upload cover images
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

-- Allow public read access for report generation (since bucket is public)
CREATE POLICY "Public can view report covers" ON storage.objects
FOR SELECT USING (
  bucket_id = 'report-covers'
);

-- Verify the policies were created
SELECT '=== UPDATED BUCKET CONFIG ===' as info;
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  updated_at
FROM storage.buckets 
WHERE id = 'report-covers';

-- Show the new RLS policies
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

-- Check if there are any files in the bucket
SELECT '=== FILES IN BUCKET ===' as info;
SELECT 
  name,
  bucket_id,
  created_at,
  updated_at
FROM storage.objects 
WHERE bucket_id = 'report-covers'
ORDER BY created_at DESC; 