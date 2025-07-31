-- Fix Storage and RLS Issues
-- This script addresses the 404 and 400 errors you're experiencing

-- ============================================
-- 1. VERIFY TABLE EXISTS
-- ============================================

-- Check if producer_resources table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'producer_resources';

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'producer_resources'
ORDER BY ordinal_position;

-- ============================================
-- 2. FIX RLS POLICIES FOR PRODUCER_RESOURCES
-- ============================================

-- Drop all existing policies first
DROP POLICY IF EXISTS "Producers can view resources" ON producer_resources;
DROP POLICY IF EXISTS "Admins can view resources" ON producer_resources;
DROP POLICY IF EXISTS "Hybrid admin/producer can view resources" ON producer_resources;
DROP POLICY IF EXISTS "Admins can insert resources" ON producer_resources;
DROP POLICY IF EXISTS "Admins can update resources" ON producer_resources;
DROP POLICY IF EXISTS "Admins can delete resources" ON producer_resources;

-- Create simplified policies that work
-- Allow all authenticated users to view resources
CREATE POLICY "Allow authenticated users to view resources" ON producer_resources
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins to insert resources
CREATE POLICY "Allow admins to insert resources" ON producer_resources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.account_type = 'admin' OR profiles.account_type = 'admin,producer')
        )
    );

-- Allow admins to update resources
CREATE POLICY "Allow admins to update resources" ON producer_resources
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.account_type = 'admin' OR profiles.account_type = 'admin,producer')
        )
    );

-- Allow admins to delete resources
CREATE POLICY "Allow admins to delete resources" ON producer_resources
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.account_type = 'admin' OR profiles.account_type = 'admin,producer')
        )
    );

-- ============================================
-- 3. FIX STORAGE BUCKET AND POLICIES
-- ============================================

-- Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contracts-and-forms', 'contracts-and-forms', false)
ON CONFLICT (id) DO NOTHING;

-- Drop all existing storage policies
DROP POLICY IF EXISTS "Producers can download resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete resources" ON storage.objects;

-- Create simplified storage policies
-- Allow authenticated users to download from contracts-and-forms bucket
CREATE POLICY "Allow authenticated users to download from contracts-and-forms" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'contracts-and-forms' 
        AND auth.role() = 'authenticated'
    );

-- Allow admins to upload to contracts-and-forms bucket
CREATE POLICY "Allow admins to upload to contracts-and-forms" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'contracts-and-forms' 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.account_type = 'admin' OR profiles.account_type = 'admin,producer')
        )
    );

-- Allow admins to update files in contracts-and-forms bucket
CREATE POLICY "Allow admins to update contracts-and-forms" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'contracts-and-forms' 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.account_type = 'admin' OR profiles.account_type = 'admin,producer')
        )
    );

-- Allow admins to delete files in contracts-and-forms bucket
CREATE POLICY "Allow admins to delete contracts-and-forms" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'contracts-and-forms' 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.account_type = 'admin' OR profiles.account_type = 'admin,producer')
        )
    );

-- ============================================
-- 4. VERIFY FIXES
-- ============================================

-- Check if table exists and has data
SELECT 
    'producer_resources table exists' as check_item,
    COUNT(*) as result
FROM information_schema.tables 
WHERE table_name = 'producer_resources';

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'producer_resources';

-- Check storage policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND qual LIKE '%contracts-and-forms%';

-- Test data access
SELECT 
    'producer_resources row count' as description,
    COUNT(*) as count
FROM producer_resources;

-- Check bucket exists
SELECT 
    'contracts-and-forms bucket exists' as check_item,
    COUNT(*) as result
FROM storage.buckets 
WHERE id = 'contracts-and-forms'; 