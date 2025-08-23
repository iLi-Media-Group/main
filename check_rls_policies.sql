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

-- Check the current RLS policies on custom_sync_requests table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'custom_sync_requests';

-- Check if RLS is enabled on the table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'custom_sync_requests';

-- Test if the current user can see the data
-- This will show us what the RLS policies are actually doing
SELECT 
  csr.id,
  csr.status,
  csr.selected_rights_holder_id,
  auth.uid() as current_user_id
FROM custom_sync_requests csr
WHERE csr.status = 'open' 
  AND csr.end_date >= NOW()
LIMIT 1; 