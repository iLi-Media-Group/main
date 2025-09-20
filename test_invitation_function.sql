-- Test the validate_producer_invitation function
-- Run this in Supabase SQL Editor

-- First, check if the function exists
SELECT 
  proname as function_name,
  proargtypes::regtype[] as parameter_types,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'validate_producer_invitation';

-- Check the current invitations
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

-- Test the function with a real invitation code
-- Replace 'your-actual-code' with a real invitation code from above
SELECT validate_producer_invitation('your-actual-code', 'babyimmastarrecords@gmail.com');

-- If the function doesn't exist, create it
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
