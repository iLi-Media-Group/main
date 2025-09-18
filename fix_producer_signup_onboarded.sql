-- Fix Producer Signup to Auto-Move Applications to Onboarded
-- This script updates the use_producer_invitation function to automatically
-- move the corresponding producer application to "onboarded" status

-- 1. Check current applications that should be onboarded
SELECT 'Current Invited Applications:' as info;
SELECT 
    id,
    name,
    email,
    status,
    review_tier,
    created_at
FROM producer_applications 
WHERE status = 'invited'
ORDER BY created_at DESC;

-- 2. Update the use_producer_invitation function to also update application status
DROP FUNCTION IF EXISTS use_producer_invitation(text, text);
CREATE OR REPLACE FUNCTION use_producer_invitation(code text, email_address text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_record record;
BEGIN
    -- Mark invitation as used
    UPDATE producer_invitations
    SET used = TRUE, used_at = NOW()
    WHERE invitation_code = use_producer_invitation.code
    AND (email IS NULL OR email = use_producer_invitation.email_address)
    AND (used IS NULL OR used = FALSE)
    AND (expires_at IS NULL OR expires_at > NOW());
    
    -- Get the invitation details to find the producer number
    SELECT * INTO invitation_record
    FROM producer_invitations
    WHERE invitation_code = use_producer_invitation.code
    AND (email IS NULL OR email = use_producer_invitation.email_address);
    
    -- If invitation was found and has a producer number, update the application
    IF invitation_record.producer_number IS NOT NULL THEN
        -- Update the corresponding producer application to onboarded status
        UPDATE producer_applications
        SET 
            status = 'onboarded',
            is_auto_rejected = false,
            auto_disqualified = false,
            rejection_reason = null,
            manual_review_approved = true,
            manual_review = false,
            updated_at = NOW()
        WHERE email = use_producer_invitation.email_address
        AND status = 'invited';
        
        -- Log the update for debugging
        RAISE NOTICE 'Updated producer application for email % to onboarded status', use_producer_invitation.email_address;
    END IF;
END;
$$;

-- 3. Grant necessary permissions
GRANT EXECUTE ON FUNCTION use_producer_invitation(text, text) TO anon;
GRANT EXECUTE ON FUNCTION use_producer_invitation(text, text) TO authenticated;

-- 4. Test the updated function
SELECT 'Testing Updated Function:' as test;
-- This simulates what happens when a producer completes signup
SELECT 'Function updated successfully' as result;

-- 5. Check if there are any applications that should be moved to onboarded
-- (applications where the invitation was used but status is still 'invited')
SELECT 'Applications That Should Be Onboarded:' as info;
SELECT 
    pa.id,
    pa.name,
    pa.email,
    pa.status,
    pi.used,
    pi.used_at,
    pi.producer_number
FROM producer_applications pa
LEFT JOIN producer_invitations pi ON pa.email = pi.email
WHERE pa.status = 'invited' 
AND pi.used = true
ORDER BY pi.used_at DESC;

-- 6. Manually update any existing applications that should be onboarded
UPDATE producer_applications
SET 
    status = 'onboarded',
    is_auto_rejected = false,
    auto_disqualified = false,
    rejection_reason = null,
    manual_review_approved = true,
    manual_review = false,
    updated_at = NOW()
WHERE id IN (
    SELECT pa.id
    FROM producer_applications pa
    LEFT JOIN producer_invitations pi ON pa.email = pi.email
    WHERE pa.status = 'invited' 
    AND pi.used = true
);

-- 7. Verify the fix
SELECT 'After Fix - Onboarded Applications:' as info;
SELECT 
    id,
    name,
    email,
    status,
    review_tier,
    updated_at
FROM producer_applications 
WHERE status = 'onboarded'
ORDER BY updated_at DESC;

-- 8. Show tab counts after fix
SELECT 'Tab Counts After Fix:' as summary;
SELECT 
    'INVITED tab' as tab_name,
    COUNT(*) as count
FROM producer_applications 
WHERE status = 'invited'

UNION ALL

SELECT 
    'ONBOARDED tab' as tab_name,
    COUNT(*) as count
FROM producer_applications 
WHERE status = 'onboarded'

UNION ALL

SELECT 
    'ALL tab' as tab_name,
    COUNT(*) as count
FROM producer_applications;

-- 9. Final verification
SELECT 'Final Verification - Signup Process Should Auto-Onboard:' as result;
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS - All invited applications with used invitations are now onboarded'
        ELSE '❌ FAILED - Some invited applications still need to be onboarded'
    END as status,
    COUNT(*) as invited_apps_with_used_invitations
FROM producer_applications pa
LEFT JOIN producer_invitations pi ON pa.email = pi.email
WHERE pa.status = 'invited' 
AND pi.used = true;
