-- Update use_artist_invitation function to also update application status
-- This will fix the workflow so artists get properly onboarded

-- ============================================
-- 1. UPDATE THE FUNCTION
-- ============================================

DROP FUNCTION IF EXISTS use_artist_invitation(text, text);
CREATE OR REPLACE FUNCTION use_artist_invitation(code text, email_address text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark the invitation as used
  UPDATE artist_invitations
  SET used = TRUE, used_at = NOW()
  WHERE invitation_code = use_artist_invitation.code
  AND (email IS NULL OR email = use_artist_invitation.email_address)
  AND NOT used
  AND (expires_at IS NULL OR expires_at > NOW());
  
  -- Update the artist application status to "onboarded"
  UPDATE artist_applications
  SET 
    status = 'onboarded',
    updated_at = NOW()
  WHERE email = use_artist_invitation.email_address
  AND status = 'invited';
END;
$$;

-- ============================================
-- 2. GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION use_artist_invitation(text, text) TO public;

-- ============================================
-- 3. TEST THE UPDATED FUNCTION
-- ============================================

-- Show the function definition
SELECT 'Updated function definition:' as info;
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'use_artist_invitation';

-- ============================================
-- 4. FIX EXISTING ARTISTS
-- ============================================

-- Update existing artists who have created accounts but still have "invited" status
UPDATE artist_applications
SET 
    status = 'onboarded',
    updated_at = NOW()
WHERE status = 'invited'
AND email IN (
    SELECT DISTINCT email 
    FROM profiles 
    WHERE account_type = 'artist_band' 
    AND artist_number IS NOT NULL
);

-- ============================================
-- 5. VERIFICATION
-- ============================================

-- Show all artist application statuses
SELECT 'All artist application statuses:' as info;
SELECT 
    email,
    name,
    status,
    created_at,
    updated_at
FROM artist_applications 
ORDER BY updated_at DESC;

-- Show artists who should be onboarded
SELECT 'Artists with accounts but still invited status:' as info;
SELECT 
    aa.email,
    aa.name,
    aa.status as application_status,
    p.account_type,
    p.artist_number
FROM artist_applications aa
LEFT JOIN profiles p ON aa.email = p.email
WHERE aa.status = 'invited'
AND p.account_type = 'artist_band'
ORDER BY aa.updated_at DESC;
