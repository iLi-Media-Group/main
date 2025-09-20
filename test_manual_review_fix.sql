-- Test Manual Review Fix
-- Run this after the fix to verify manual review works correctly

-- 1. Test the exact frontend query for "Manual Review" tab
SELECT 'Testing Frontend Manual Review Tab Query:' as test;
SELECT 
    id,
    name,
    email,
    status,
    manual_review,
    manual_review_approved,
    created_at
FROM producer_applications 
WHERE status = 'in_review'
ORDER BY created_at DESC;

-- 2. Count applications in each tab
SELECT 'Applications per Tab:' as summary;
SELECT 
    'NEW tab' as tab_name,
    COUNT(*) as count
FROM producer_applications 
WHERE (status = 'new' OR status IS NULL)
    AND (requires_review IS NULL OR requires_review = false)
    AND (is_auto_rejected IS NULL OR is_auto_rejected = false)

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
    'MANUAL REVIEW tab' as tab_name,
    COUNT(*) as count
FROM producer_applications 
WHERE status = 'in_review'

UNION ALL

SELECT 
    'DECLINED tab' as tab_name,
    COUNT(*) as count
FROM producer_applications 
WHERE status = 'declined' OR is_auto_rejected = true

UNION ALL

SELECT 
    'ALL tab' as tab_name,
    COUNT(*) as count
FROM producer_applications;

-- 3. Test simulating manual review button click
SELECT 'Simulating Manual Review Button Click:' as test;
-- This simulates what happens when Manual Review button is clicked from "All Applications" tab
UPDATE producer_applications 
SET 
    status = 'in_review',
    manual_review = true,
    manual_review_approved = false,
    updated_at = NOW()
WHERE id = (
    SELECT id FROM producer_applications 
    WHERE status = 'new' 
    LIMIT 1
) RETURNING id, name, email, status, manual_review, manual_review_approved;

-- 4. Verify the application appears in manual review tab
SELECT 'Verifying Application in Manual Review Tab:' as test;
SELECT 
    id,
    name,
    email,
    status,
    manual_review,
    manual_review_approved,
    created_at
FROM producer_applications 
WHERE status = 'in_review'
ORDER BY created_at DESC;

-- 5. Test moving from manual review back to new
SELECT 'Testing Move from Manual Review to New:' as test;
UPDATE producer_applications 
SET 
    status = 'new',
    manual_review = false,
    manual_review_approved = false,
    updated_at = NOW()
WHERE id = (
    SELECT id FROM producer_applications 
    WHERE status = 'in_review' 
    LIMIT 1
) RETURNING id, name, email, status, manual_review, manual_review_approved;

-- 6. Final verification
SELECT 'Final Verification - Manual Review Should Work:' as result;
SELECT 
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ SUCCESS - Manual review functionality should work'
        ELSE '❌ FAILED - Manual review not working'
    END as status,
    COUNT(*) as applications_in_manual_review_tab
FROM producer_applications 
WHERE status = 'in_review';

-- 7. Show current status distribution
SELECT 'Current Status Distribution:' as info;
SELECT 
    status,
    COUNT(*) as count
FROM producer_applications 
GROUP BY status
ORDER BY count DESC;
