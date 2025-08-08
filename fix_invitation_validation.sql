-- Fix producer invitation validation
-- Run this in Supabase SQL Editor

-- Add missing columns to producer_invitations table
ALTER TABLE producer_invitations 
ADD COLUMN IF NOT EXISTS used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days';

-- Update existing invitations to not be used
UPDATE producer_invitations SET used = FALSE WHERE used IS NULL;

-- Drop and recreate the validation function
DROP FUNCTION IF EXISTS validate_producer_invitation(text, text);
CREATE OR REPLACE FUNCTION validate_producer_invitation(code text, email_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM producer_invitations
        WHERE invitation_code = code
        AND (email IS NULL OR email = validate_producer_invitation.email_address)
        AND NOT used
        AND (expires_at IS NULL OR expires_at > NOW())
    );
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
    AND NOT used
    AND (expires_at IS NULL OR expires_at > NOW());
END;
$$;

-- Test the validation function
SELECT validate_producer_invitation('test-invitation-001', 'test@example.com');

-- Show current invitations
SELECT 
  id,
  email,
  first_name,
  last_name,
  producer_number,
  invitation_code,
  used,
  created_at,
  expires_at
FROM producer_invitations 
ORDER BY created_at DESC;
