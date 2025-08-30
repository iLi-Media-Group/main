-- Fix the specific RLS policy issue
-- Replace the hardcoded email policy with a proper one

-- Drop the problematic policy that has hardcoded email
DROP POLICY IF EXISTS "Users can read own applications v2" ON rights_holder_applications;

-- Create a proper policy that works for any user
CREATE POLICY "Users can read own applications" ON rights_holder_applications
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Verify the fix by showing the updated policies
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

SELECT 'RLS policy fixed - removed hardcoded email' as status;
