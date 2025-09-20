-- CHECK CURRENT RLS POLICIES: See what policies exist now
-- This will show us the current state of RLS policies

-- Show all current policies on the profiles table
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- Check if RLS is enabled
SELECT 
    'RLS STATUS' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- Count policies by type
SELECT 
    'POLICY COUNT' as info,
    cmd,
    COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'profiles'
GROUP BY cmd
ORDER BY cmd;
