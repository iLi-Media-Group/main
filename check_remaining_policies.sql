-- CHECK REMAINING POLICIES: See what policies are still allowing cross-account access
-- This will show us what policies remain after removing the dangerous ones

-- Show all remaining policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- Check for any remaining policies with dangerous conditions
SELECT 
    'REMAINING DANGEROUS POLICIES' as warning,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
    AND (
        qual LIKE '%true%' 
        OR qual IS NULL 
        OR qual = ''
        OR qual LIKE '%1=1%'
        OR qual LIKE '%auth.uid() IS NOT NULL%'
    );
