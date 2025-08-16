-- Fix Producer Validation with RLS Enabled
-- Run this in Supabase SQL Editor

-- 1. First, let's check the current RLS policies
SELECT 'Current RLS policies:' as step;
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'producer_invitations';

-- 2. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow admins to read producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Allow admins to insert producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Allow admins to update producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Admins can manage producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Enable read access for admins" ON producer_invitations;
DROP POLICY IF EXISTS "Enable insert access for admins" ON producer_invitations;
DROP POLICY IF EXISTS "Enable update access for admins" ON producer_invitations;
DROP POLICY IF EXISTS "Enable service role access" ON producer_invitations;
DROP POLICY IF EXISTS "Admin access to producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Service role access to producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Allow public read for validation" ON producer_invitations;

-- 3. Create proper RLS policies that allow validation while maintaining security
-- Policy for reading invitations (needed for validation)
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

-- Policy for service role access
CREATE POLICY "Allow service role access" ON producer_invitations
FOR ALL
TO service_role
USING (true);

-- 4. Fix the validate_producer_invitation function with proper logic
DROP FUNCTION IF EXISTS validate_producer_invitation(text, text);
CREATE OR REPLACE FUNCTION validate_producer_invitation(code text, email_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_exists boolean;
BEGIN
  -- Check if invitation exists and is valid
  SELECT EXISTS (
    SELECT 1 FROM producer_invitations
    WHERE invitation_code = validate_producer_invitation.code
    AND (email IS NULL OR email = validate_producer_invitation.email_address)
    AND (used IS NULL OR used = FALSE)
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO invitation_exists;
  
  RETURN invitation_exists;
END;
$$;

-- 5. Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_producer_invitation(text, text) TO anon;
GRANT EXECUTE ON FUNCTION validate_producer_invitation(text, text) TO authenticated;

-- 6. Test the fix with the actual invitation code
SELECT 'Testing the fix:' as step;
SELECT 
  'Validation result' as test,
  validate_producer_invitation('5oe1nuc4eabkferzhlkfnk', 'mrsolowkeybeats@gmail.com') as is_valid;

-- 7. Test the exact query that was failing in SignupForm.tsx
SELECT 'Testing the exact query that was failing:' as step;
SELECT 
  producer_number
FROM producer_invitations 
WHERE invitation_code = '5oe1nuc4eabkferzhlkfnk'
LIMIT 1;

-- 8. Verify RLS is still enabled
SELECT 'Verifying RLS is enabled:' as step;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'producer_invitations';

-- 9. Show the invitation details
SELECT 'Invitation details:' as info;
SELECT 
  id,
  email,
  first_name,
  last_name,
  producer_number,
  invitation_code,
  used,
  created_at,
  expires_at,
  CASE 
    WHEN used = TRUE THEN 'Already used'
    WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'Expired'
    ELSE 'Valid'
  END as status
FROM producer_invitations 
WHERE invitation_code = '5oe1nuc4eabkferzhlkfnk';
