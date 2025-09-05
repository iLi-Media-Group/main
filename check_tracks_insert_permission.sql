-- Check tracks table RLS policies and structure
-- This will help identify why INSERT operations are failing

-- 1. Check RLS policies on tracks table
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
WHERE tablename = 'tracks';

-- 2. Check if RLS is enabled on tracks table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'tracks';

-- 3. Check tracks table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' 
ORDER BY ordinal_position;

-- 4. Check if the user has any tracks (to verify they can read)
SELECT COUNT(*) as user_tracks_count 
FROM tracks 
WHERE track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18';

-- 5. Check if there are any triggers on tracks table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'tracks';
