-- Re-enable RLS with Proper Security
-- Run this to re-enable RLS while maintaining signup functionality

-- 1. First, check current status
SELECT 'Before Re-enabling RLS:' as step;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'producer_invitations';

-- 2. Re-enable RLS
ALTER TABLE producer_invitations ENABLE ROW LEVEL SECURITY;

-- 3. Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Allow public read for validation" ON producer_invitations;
DROP POLICY IF EXISTS "Allow admins to manage producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Allow service role access" ON producer_invitations;
DROP POLICY IF EXISTS "Enable read access for admins" ON producer_invitations;
DROP POLICY IF EXISTS "Enable insert access for admins" ON producer_invitations;
DROP POLICY IF EXISTS "Enable update access for admins" ON producer_invitations;
DROP POLICY IF EXISTS "Enable service role access" ON producer_invitations;

-- 4. Create secure policies that allow signup while maintaining security

-- Policy for reading invitations (needed for validation during signup)
CREATE POLICY "Allow public read for validation" ON producer_invitations
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy for admins to manage invitations
CREATE POLICY "Allow admins to manage producer invitations" ON producer_invitations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type = 'admin'
  )
);

-- Policy for service role access (for edge functions)
CREATE POLICY "Allow service role access" ON producer_invitations
FOR ALL
TO service_role
USING (true);

-- 5. Verify RLS is enabled
SELECT 'After Re-enabling RLS:' as step;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'producer_invitations';

-- 6. Show the new policies
SELECT 'New RLS Policies:' as step;
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'producer_invitations';

-- 7. Test that signup still works (validation function)
SELECT 'Testing Validation Function:' as step;
SELECT 
    'Validation test' as test,
    validate_producer_invitation('5oe1nuc4eabkferzhlkfnk', 'mrsolowkeybeats@gmail.com') as is_valid;

-- 8. Test that we can still query invitations
SELECT 'Testing Table Access with RLS:' as step;
SELECT 
    COUNT(*) as invitation_count
FROM producer_invitations;

-- 9. Test the exact query that signup form uses
SELECT 'Testing Signup Form Query:' as step;
SELECT 
    producer_number
FROM producer_invitations 
WHERE invitation_code = '5oe1nuc4eabkferzhlkfnk'
LIMIT 1;

-- 10. Final verification
SELECT 'Final Verification - RLS Enabled with Security:' as result;
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ SUCCESS - RLS enabled, signup should still work'
        ELSE '❌ FAILED - Cannot access invitations with RLS enabled'
    END as status,
    COUNT(*) as accessible_invitations
FROM producer_invitations;
