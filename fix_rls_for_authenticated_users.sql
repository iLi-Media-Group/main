-- Fix RLS policies to allow authenticated users to read their own applications
-- This will resolve the 403 Forbidden error

-- First, let's see what policies currently exist
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

-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Allow authenticated users to read rights_holder_applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Allow authenticated users to read their own rights_holder_applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Users can read own applications" ON rights_holder_applications;
DROP POLICY IF EXISTS "Users can read own applications v2" ON rights_holder_applications;

-- Create a policy that allows authenticated users to read their own applications
CREATE POLICY "Allow authenticated users to read their own rights_holder_applications"
ON rights_holder_applications FOR SELECT TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Verify the new policy was created
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
