-- Permanent Fix for Producer Signup with RLS Enabled
-- Run this AFTER the immediate fix to re-enable RLS with proper policies

-- 1. Re-enable RLS
ALTER TABLE producer_invitations ENABLE ROW LEVEL SECURITY;

-- 2. Create proper RLS policies that allow validation during signup
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

-- 3. Update the validation function to be more robust
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

-- 4. Create function to mark invitation as used
DROP FUNCTION IF EXISTS use_producer_invitation(text, text);
CREATE OR REPLACE FUNCTION use_producer_invitation(code text, email_address text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE producer_invitations
  SET used = TRUE, used_at = NOW()
  WHERE invitation_code = use_producer_invitation.code
  AND (email IS NULL OR email = use_producer_invitation.email_address)
  AND (used IS NULL OR used = FALSE)
  AND (expires_at IS NULL OR expires_at > NOW());
END;
$$;

-- 5. Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_producer_invitation(text, text) TO anon;
GRANT EXECUTE ON FUNCTION validate_producer_invitation(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION use_producer_invitation(text, text) TO anon;
GRANT EXECUTE ON FUNCTION use_producer_invitation(text, text) TO authenticated;

-- 6. Test the permanent fix
SELECT 'Testing the permanent fix:' as step;
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

-- 8. Verify RLS is enabled
SELECT 'Verifying RLS is enabled:' as step;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'producer_invitations';

-- 9. Show the policies
SELECT 'Current RLS policies:' as step;
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'producer_invitations';
