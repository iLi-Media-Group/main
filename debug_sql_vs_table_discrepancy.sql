-- Debug SQL vs Table View Discrepancy
-- This will help us understand why SQL shows 1 but table shows 4

-- 1. Check current user and role
SELECT 'Current User Context:' as info;
SELECT 
    current_user as current_user,
    session_user as session_user,
    current_setting('role') as current_role;

-- 2. Check if RLS is enabled
SELECT 'RLS Status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'producer_applications';

-- 3. Check all RLS policies
SELECT 'All RLS Policies:' as info;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'producer_applications';

-- 4. Try different query approaches
SELECT 'Approach 1 - Simple SELECT:' as info;
SELECT COUNT(*) as count_1 FROM producer_applications;

SELECT 'Approach 2 - With explicit schema:' as info;
SELECT COUNT(*) as count_2 FROM public.producer_applications;

SELECT 'Approach 3 - As superuser:' as info;
SELECT COUNT(*) as count_3 FROM producer_applications;

-- 5. Show all records with different approaches
SELECT 'All Records - Approach 1:' as info;
SELECT 
    id,
    name,
    email,
    status,
    created_at
FROM producer_applications 
ORDER BY created_at DESC;

SELECT 'All Records - Approach 2:' as info;
SELECT 
    id,
    name,
    email,
    status,
    created_at
FROM public.producer_applications 
ORDER BY created_at DESC;

-- 6. Check if there are any triggers or views
SELECT 'Triggers:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'producer_applications';

SELECT 'Views that might affect this table:' as info;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name LIKE '%producer%'
AND table_schema = 'public';

-- 7. Check for any constraints that might affect visibility
SELECT 'Constraints:' as info;
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'producer_applications'::regclass; 