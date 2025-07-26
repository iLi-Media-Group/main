-- Check RLS Policies on producer_applications
SELECT 'RLS Status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'producer_applications';

-- Check all RLS policies
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

-- Check current user context
SELECT 'Current User Context:' as info;
SELECT 
    current_user as current_user,
    session_user as session_user,
    current_setting('role') as current_role;

-- Try to bypass RLS temporarily
SELECT 'Bypassing RLS - All Records:' as info;
SELECT 
    id,
    name,
    email,
    status,
    created_at
FROM producer_applications 
ORDER BY created_at DESC; 