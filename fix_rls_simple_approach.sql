-- Simple RLS fix - allow authenticated users to read all applications
-- This is a temporary fix to get the frontend working

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can read own applications by email" ON rights_holder_applications;

-- Create a simple policy that allows all authenticated users to read all applications
CREATE POLICY "Allow authenticated users to read all applications"
ON rights_holder_applications FOR SELECT TO authenticated
USING (true);

-- Verify the new policies
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'rights_holder_applications'
ORDER BY policyname;

-- Test if we can now read the data
SELECT 
  'Testing simple policy' as test,
  COUNT(*) as total_applications
FROM rights_holder_applications;
