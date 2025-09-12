-- Check the actual structure of sync_submission_favorites table and its RLS policies
-- This will tell us exactly what columns exist and what policies are in place

-- 1. Check table structure
SELECT 
    'Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sync_submission_favorites' 
ORDER BY ordinal_position;

-- 2. Check if RLS is enabled
SELECT 
    'RLS Status' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'sync_submission_favorites';

-- 3. Check existing RLS policies
SELECT 
    'RLS Policies' as check_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'sync_submission_favorites';

-- 4. Check if table exists and has data
SELECT 
    'Table Data' as check_type,
    COUNT(*) as total_records
FROM sync_submission_favorites;

-- 5. Check sample data (if any exists)
SELECT 
    'Sample Data' as check_type,
    id,
    client_id,
    sync_submission_id,
    created_at
FROM sync_submission_favorites 
LIMIT 5;
