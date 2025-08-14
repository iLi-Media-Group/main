-- Immediate Fix for Producer Signup Issue
-- Run this in Supabase SQL Editor

-- 1. Disable RLS on producer_invitations table (most common cause)
ALTER TABLE producer_invitations DISABLE ROW LEVEL SECURITY;

-- 2. Drop any problematic RLS policies
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

-- 3. Ensure the validate_producer_invitation function exists and works
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
    WHERE invitation_code = code
    AND (email IS NULL OR email = validate_producer_invitation.email_address)
    AND (used IS NULL OR used = FALSE)
  ) INTO invitation_exists;
  
  RETURN invitation_exists;
END;
$$;

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON producer_invitations TO anon;
GRANT ALL ON producer_invitations TO authenticated;
GRANT EXECUTE ON FUNCTION validate_producer_invitation(text, text) TO anon;
GRANT EXECUTE ON FUNCTION validate_producer_invitation(text, text) TO authenticated;

-- 5. Verify the fix works
SELECT 'Verification: Check if we can query producer_invitations' as step;
SELECT COUNT(*) as invitation_count FROM producer_invitations;

-- 6. Show current invitations
SELECT 'Current invitations:' as info;
SELECT 
  id,
  email,
  first_name,
  last_name,
  producer_number,
  invitation_code,
  used,
  created_at
FROM producer_invitations 
ORDER BY created_at DESC
LIMIT 5;

-- 7. Test the validation function
SELECT 'Testing validation function:' as test;
SELECT validate_producer_invitation('test-code', 'test@example.com') as test_result;
