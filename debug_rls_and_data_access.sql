-- Debug RLS and Data Access Issues
-- This script helps identify why data might not be visible

-- 1. Check if RLS is enabled on the table
SELECT 'RLS Status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'producer_applications';

-- 2. Check all RLS policies on producer_applications
SELECT 'All RLS Policies on producer_applications:' as info;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'producer_applications';

-- 3. Check current user and role
SELECT 'Current User Info:' as info;
SELECT 
    current_user as current_user,
    session_user as session_user,
    current_setting('role') as current_role;

-- 4. Try to insert a simple test record to see if there are any constraints
SELECT 'Attempting to insert test record:' as info;
INSERT INTO producer_applications (
    name,
    email,
    primary_genre,
    status,
    created_at
) VALUES (
    'Test Producer',
    'test@example.com',
    'Hip Hop',
    'new',
    NOW()
) ON CONFLICT DO NOTHING;

-- 5. Check if the test record was inserted
SELECT 'After test insert - Total count:' as info;
SELECT COUNT(*) as total_count FROM producer_applications;

-- 6. Show the test record if it exists
SELECT 'Test record (if exists):' as info;
SELECT 
    id,
    name,
    email,
    status,
    created_at
FROM producer_applications 
WHERE email = 'test@example.com';

-- 7. Check if there are any triggers that might be affecting the data
SELECT 'Triggers on producer_applications:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'producer_applications'; 