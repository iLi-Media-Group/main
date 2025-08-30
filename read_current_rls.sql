-- Read Current RLS Policies for rights_holder_applications
-- This will show us exactly what policies exist

-- Check if RLS is enabled on the table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'rights_holder_applications';

-- Show all current policies for the table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'rights_holder_applications'
ORDER BY policyname;

-- Show the exact policy conditions in a readable format
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'No condition'
  END as policy_condition
FROM pg_policies 
WHERE tablename = 'rights_holder_applications'
ORDER BY policyname;
