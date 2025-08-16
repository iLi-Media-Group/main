-- Fix Producer Applications Workflow
-- This script implements the complete producer applications workflow with proper tab transitions

-- ============================================
-- 1. UPDATE THE use_producer_invitation FUNCTION
-- ============================================

-- Update the function to automatically move applications to onboarded when producer completes signup
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION use_producer_invitation(text, text) TO anon;
GRANT EXECUTE ON FUNCTION use_producer_invitation(text, text) TO authenticated;

-- ============================================
-- 2. CREATE HELPER FUNCTIONS FOR TAB TRANSITIONS
-- ============================================

-- Function to move application to New Applicants tab
CREATE OR REPLACE FUNCTION move_to_new_applicants(app_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE producer_applications
    SET 
        status = 'new',
        is_auto_rejected = false,
        auto_disqualified = false,
        rejection_reason = null,
        manual_review = false,
        manual_review_approved = false,
        review_tier = null,
        updated_at = NOW()
    WHERE id = app_id;
END;
$$;

-- Function to move application to Manual Review tab
CREATE OR REPLACE FUNCTION move_to_manual_review(app_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE producer_applications
    SET 
        status = 'in_review',
        manual_review = true,
        manual_review_approved = false,
        updated_at = NOW()
    WHERE id = app_id;
END;
$$;

-- Function to move application to Invited tab
CREATE OR REPLACE FUNCTION move_to_invited(app_id uuid, tier text DEFAULT 'Tier 1')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE producer_applications
    SET 
        status = 'invited',
        review_tier = tier,
        is_auto_rejected = false,
        auto_disqualified = false,
        rejection_reason = null,
        manual_review = false,
        manual_review_approved = false,
        -- Clear fields that cause requires_review = true
        signed_to_label = 'No',
        signed_to_publisher = 'No',
        signed_to_manager = 'No',
        entity_collects_payment = 'No',
        production_master_percentage = 100,
        updated_at = NOW()
    WHERE id = app_id;
END;
$$;

-- Function to move application to Save For Later tab
CREATE OR REPLACE FUNCTION move_to_save_for_later(app_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE producer_applications
    SET 
        status = 'save_for_later',
        manual_review = false,
        manual_review_approved = false,
        updated_at = NOW()
    WHERE id = app_id;
END;
$$;

-- Function to move application to Declined tab
CREATE OR REPLACE FUNCTION move_to_declined(app_id uuid, reason text DEFAULT null)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE producer_applications
    SET 
        status = 'declined',
        is_auto_rejected = true,
        rejection_reason = reason,
        manual_review = false,
        manual_review_approved = false,
        review_tier = null,
        updated_at = NOW()
    WHERE id = app_id;
END;
$$;

-- Grant permissions for helper functions
GRANT EXECUTE ON FUNCTION move_to_new_applicants(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION move_to_manual_review(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION move_to_invited(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION move_to_save_for_later(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION move_to_declined(uuid, text) TO authenticated;

-- ============================================
-- 3. FIX EXISTING APPLICATIONS TO PROPER STATUS
-- ============================================

-- Fix applications that should be onboarded (where invitation was used)
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

-- Fix applications with status 'manual_review' to 'in_review'
UPDATE producer_applications
SET 
    status = 'in_review',
    manual_review = true,
    updated_at = NOW()
WHERE status = 'manual_review';

-- Ensure new applications have proper flags
UPDATE producer_applications
SET 
    status = 'new',
    is_auto_rejected = false,
    auto_disqualified = false,
    updated_at = NOW()
WHERE status IS NULL OR status = 'pending';

-- ============================================
-- 4. VERIFY TAB COUNTS AND STATUSES
-- ============================================

-- Show current tab counts
SELECT 'Current Tab Counts:' as info;
SELECT 
    'NEW APPLICANTS tab' as tab_name,
    COUNT(*) as count
FROM producer_applications 
WHERE status = 'new' AND is_auto_rejected = false

UNION ALL

SELECT 
    'MANUAL REVIEW tab' as tab_name,
    COUNT(*) as count
FROM producer_applications 
WHERE status = 'in_review'

UNION ALL

SELECT 
    'INVITED tab' as tab_name,
    COUNT(*) as count
FROM producer_applications 
WHERE status = 'invited'

UNION ALL

SELECT 
    'SAVE FOR LATER tab' as tab_name,
    COUNT(*) as count
FROM producer_applications 
WHERE status = 'save_for_later' OR requires_review = true

UNION ALL

SELECT 
    'DECLINED tab' as tab_name,
    COUNT(*) as count
FROM producer_applications 
WHERE status = 'declined' OR is_auto_rejected = true

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

-- Show applications by status
SELECT 'Applications by Status:' as info;
SELECT 
    status,
    COUNT(*) as count
FROM producer_applications 
GROUP BY status
ORDER BY count DESC;

-- ============================================
-- 5. TEST THE WORKFLOW FUNCTIONS
-- ============================================

-- Test moving an application through the workflow
SELECT 'Testing Workflow Functions:' as test;

-- Get a test application
DO $$
DECLARE
    test_app_id uuid;
BEGIN
    -- Get first application for testing
    SELECT id INTO test_app_id 
    FROM producer_applications 
    WHERE status = 'new' 
    LIMIT 1;
    
    IF test_app_id IS NOT NULL THEN
        -- Test the workflow functions
        PERFORM move_to_manual_review(test_app_id);
        RAISE NOTICE 'Moved application % to manual review', test_app_id;
        
        PERFORM move_to_invited(test_app_id, 'Tier 1');
        RAISE NOTICE 'Moved application % to invited', test_app_id;
        
        PERFORM move_to_save_for_later(test_app_id);
        RAISE NOTICE 'Moved application % to save for later', test_app_id;
        
        PERFORM move_to_new_applicants(test_app_id);
        RAISE NOTICE 'Moved application % back to new applicants', test_app_id;
    ELSE
        RAISE NOTICE 'No test applications found';
    END IF;
END $$;

-- ============================================
-- 6. FINAL VERIFICATION
-- ============================================

-- Verify that the workflow is working correctly
SELECT 'Final Verification - Workflow Status:' as result;
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS - All applications have proper status'
        ELSE '❌ FAILED - Some applications have invalid status'
    END as status,
    COUNT(*) as invalid_applications
FROM producer_applications 
WHERE status NOT IN ('new', 'in_review', 'invited', 'save_for_later', 'declined', 'onboarded');

-- Show final tab counts
SELECT 'Final Tab Counts:' as summary;
SELECT 
    'NEW APPLICANTS tab' as tab_name,
    COUNT(*) as count
FROM producer_applications 
WHERE status = 'new' AND is_auto_rejected = false

UNION ALL

SELECT 
    'MANUAL REVIEW tab' as tab_name,
    COUNT(*) as count
FROM producer_applications 
WHERE status = 'in_review'

UNION ALL

SELECT 
    'INVITED tab' as tab_name,
    COUNT(*) as count
FROM producer_applications 
WHERE status = 'invited'

UNION ALL

SELECT 
    'SAVE FOR LATER tab' as tab_name,
    COUNT(*) as count
FROM producer_applications 
WHERE status = 'save_for_later' OR requires_review = true

UNION ALL

SELECT 
    'DECLINED tab' as tab_name,
    COUNT(*) as count
FROM producer_applications 
WHERE status = 'declined' OR is_auto_rejected = true

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
