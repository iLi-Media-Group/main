-- SHOW ACTUAL POLICIES: Get the real policy information needed to make decisions
-- This shows the actual policy names and their exact conditions

-- Show ALL policies with their exact names and conditions
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;
