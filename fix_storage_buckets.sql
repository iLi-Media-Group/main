-- Fix Storage Buckets for Rights Holder Uploads
-- This script ensures proper storage bucket configuration

-- ============================================
-- 1. CHECK AND CREATE STORAGE BUCKETS
-- ============================================

-- Check if track-audio bucket exists
SELECT 'track-audio bucket check' as status,
       CASE
         WHEN EXISTS (SELECT FROM storage.buckets WHERE id = 'track-audio')
         THEN 'track-audio bucket exists'
         ELSE 'track-audio bucket missing'
       END as result;

-- Check if track-images bucket exists
SELECT 'track-images bucket check' as status,
       CASE
         WHEN EXISTS (SELECT FROM storage.buckets WHERE id = 'track-images')
         THEN 'track-images bucket exists'
         ELSE 'track-images bucket missing'
       END as result;

-- ============================================
-- 2. CREATE BUCKETS IF THEY DON'T EXIST
-- ============================================

-- Create track-audio bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('track-audio', 'track-audio', true, 52428800, ARRAY['audio/*'])
ON CONFLICT (id) DO NOTHING;

-- Create track-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('track-images', 'track-images', true, 2097152, ARRAY['image/*'])
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. SET UP STORAGE POLICIES
-- ============================================

-- Drop existing policies for track-audio (with unique names)
DROP POLICY IF EXISTS "Public Access track-audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete audio" ON storage.objects;

-- Drop existing policies for track-images (with unique names)
DROP POLICY IF EXISTS "Public Access track-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

-- Create policies for track-audio bucket
CREATE POLICY "Public Access track-audio" ON storage.objects
    FOR SELECT USING (bucket_id = 'track-audio');

CREATE POLICY "Authenticated users can upload audio" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'track-audio' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can update audio" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'track-audio' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can delete audio" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'track-audio' 
        AND auth.role() = 'authenticated'
    );

-- Create policies for track-images bucket
CREATE POLICY "Public Access track-images" ON storage.objects
    FOR SELECT USING (bucket_id = 'track-images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'track-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can update images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'track-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can delete images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'track-images' 
        AND auth.role() = 'authenticated'
    );

-- ============================================
-- 4. VERIFICATION
-- ============================================

-- List all storage buckets
SELECT 'Storage buckets' as status,
       id,
       name,
       public,
       file_size_limit,
       allowed_mime_types
FROM storage.buckets
WHERE id IN ('track-audio', 'track-images');

-- List storage policies
SELECT 'Storage policies' as status,
       policyname,
       cmd,
       permissive,
       roles,
       qual
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%track-audio%' OR policyname LIKE '%track-images%'
ORDER BY policyname;
