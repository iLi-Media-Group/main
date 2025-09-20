-- Fix the validate_producer_invitation function
-- Run this in Supabase SQL Editor

-- First, let's check what invitations exist
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
ORDER BY created_at DESC;

-- Drop and recreate the validation function with better error handling
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

-- Drop and recreate the use function
DROP FUNCTION IF EXISTS use_producer_invitation(text, text);
CREATE OR REPLACE FUNCTION use_producer_invitation(code text, email_address text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE producer_invitations
  SET used = TRUE, used_at = NOW()
  WHERE invitation_code = code
  AND (email IS NULL OR email = use_producer_invitation.email_address)
  AND (used IS NULL OR used = FALSE);
END;
$$;

-- Test the function with a real invitation code
-- Replace 'your-actual-invitation-code' with a real code from the table above
SELECT validate_producer_invitation('your-actual-invitation-code', 'babyimmastarrecords@gmail.com');
