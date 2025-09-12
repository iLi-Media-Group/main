-- Test script to verify favorites database operations
-- Run this in Supabase SQL Editor to check if favorites are working

-- 1. Check current favorites for the client
SELECT 
    'Current Favorites' as test_type,
    COUNT(*) as total_favorites
FROM sync_submission_favorites 
WHERE client_id = 'c688fcdf-c5fa-46cd-b5c5-eb16f0632458';

-- 2. Check the specific favorite that should exist
SELECT 
    'Specific Favorite' as test_type,
    id,
    client_id,
    sync_submission_id,
    created_at
FROM sync_submission_favorites 
WHERE client_id = 'c688fcdf-c5fa-46cd-b5c5-eb16f0632458'
AND sync_submission_id = 'bedf1003-4c5d-4ce9-8b81-367d3d8313c5';

-- 3. Test inserting a new favorite (this will fail if RLS is blocking it)
-- Uncomment the lines below to test insert:
/*
INSERT INTO sync_submission_favorites (client_id, sync_submission_id)
VALUES ('c688fcdf-c5fa-46cd-b5c5-eb16f0632458', 'bedf1003-4c5d-4ce9-8b81-367d3d8313c5')
ON CONFLICT (client_id, sync_submission_id) DO NOTHING;
*/

-- 4. Check RLS policies on sync_submission_favorites
SELECT 
    'RLS Policies' as test_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'sync_submission_favorites';

-- 5. Check if RLS is enabled
SELECT 
    'RLS Status' as test_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'sync_submission_favorites';
