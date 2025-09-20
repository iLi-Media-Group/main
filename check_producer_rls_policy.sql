-- CHECK PRODUCER RLS POLICY: See what policies exist for producers
-- This will show us how producers are handled in the RLS policies

-- Show all current policies on the profiles table
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- Check if there are any producer-specific policies
SELECT 
    'PRODUCER POLICIES' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
    AND (policyname LIKE '%producer%' OR qual LIKE '%producer%')
ORDER BY cmd, policyname;
