-- Test RLS Policy for Rights Holder Applications
-- This script will help us debug the RLS policy issue

-- First, let's see what the current user's email is in auth.users
SELECT 
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'ilimediagroup3@gmail.com';

-- Now let's test the RLS policy directly
-- This simulates what the user should be able to see
SELECT 
  'Testing RLS policy for user: ilimediagroup3@gmail.com' as test_info;

-- Let's also check if there are any other policies that might be interfering
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'rights_holder_applications'
ORDER BY policyname;

-- Let's create a simpler policy that should definitely work
-- Drop the existing user policy
DROP POLICY IF EXISTS "Users can read own applications" ON rights_holder_applications;

-- Create a new policy that's more explicit
CREATE POLICY "Users can read own applications v2" ON rights_holder_applications
  FOR SELECT USING (
    email = 'ilimediagroup3@gmail.com' OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Test the new policy
SELECT 'New RLS policy created' as status;
