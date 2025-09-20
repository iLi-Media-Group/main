-- Check Current RLS Status
-- Run this in Supabase SQL Editor to see the current state

-- 1. Check if RLS is enabled on producer_invitations table
SELECT 'Current RLS Status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'producer_invitations';

-- 2. Check current policies
SELECT 'Current RLS Policies:' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'producer_invitations';

-- 3. Check table permissions
SELECT 'Current Table Permissions:' as info;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'producer_invitations';

-- 4. Test if we can still query the table (should work even with RLS disabled)
SELECT 'Testing Table Access:' as test;
SELECT 
    COUNT(*) as invitation_count
FROM producer_invitations;

-- 5. Show current invitations
SELECT 'Current Invitations:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    producer_number,
    invitation_code,
    used,
    created_at
FROM producer_invitations 
ORDER BY created_at DESC;
