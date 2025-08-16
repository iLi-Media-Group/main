-- Test Invite Fix
-- Run this after the fix to verify invitations work correctly

-- 1. Test the exact frontend queries for each tab
SELECT 'Testing Frontend Tab Queries:' as test;

-- Invited tab query
SELECT 'INVITED tab applications:' as tab_name;
SELECT 
    id,
    name,
    email,
    status,
    review_tier,
    requires_review
FROM producer_applications 
WHERE status = 'invited'
ORDER BY created_at DESC;

-- Save For Later tab query
SELECT 'SAVE FOR LATER tab applications:' as tab_name;
SELECT 
    id,
    name,
    email,
    status,
    review_tier,
    requires_review
FROM producer_applications 
WHERE status = 'save_for_later' OR requires_review = true
ORDER BY created_at DESC;

-- 2. Check for applications that appear in multiple tabs
SELECT 'Applications in Multiple Tabs (Should be 0):' as check;
SELECT 
    id,
    name,
    email,
    status,
    review_tier,
    requires_review,
    CASE 
        WHEN status = 'invited' THEN '✅ In INVITED tab'
        ELSE '❌ Not in INVITED tab'
    END as invited_tab,
    CASE 
        WHEN requires_review = true OR status = 'save_for_later' THEN '✅ In SAVE FOR LATER tab'
        ELSE '❌ Not in SAVE FOR LATER tab'
    END as save_for_later_tab
FROM producer_applications 
WHERE (status = 'invited' AND (requires_review = true OR status = 'save_for_later'))
   OR (status = 'invited' AND requires_review = true);

-- 3. Count applications in each tab
SELECT 'Applications per Tab:' as summary;
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
    'ALL tab' as tab_name,
    COUNT(*) as count
FROM producer_applications;

-- 4. Test simulating an invitation from Save For Later tab
SELECT 'Simulating Invitation from Save For Later:' as test;
-- This simulates what happens when Invite Tier 1 button is clicked from Save For Later tab
UPDATE producer_applications 
SET 
    status = 'invited',
    review_tier = 'Tier 1',
    requires_review = false,
    updated_at = NOW()
WHERE id = (
    SELECT id FROM producer_applications 
    WHERE (status = 'save_for_later' OR requires_review = true)
    AND status != 'invited'
    LIMIT 1
) RETURNING id, name, email, status, review_tier, requires_review;

-- 5. Verify the test application appears only in Invited tab
SELECT 'Verifying Test Application:' as test;
SELECT 
    id,
    name,
    email,
    status,
    review_tier,
    requires_review,
    CASE 
        WHEN status = 'invited' THEN '✅ In INVITED tab'
        ELSE '❌ Not in INVITED tab'
    END as invited_tab,
    CASE 
        WHEN requires_review = true OR status = 'save_for_later' THEN '✅ In SAVE FOR LATER tab'
        ELSE '❌ Not in SAVE FOR LATER tab'
    END as save_for_later_tab
FROM producer_applications 
WHERE status = 'invited'
ORDER BY updated_at DESC
LIMIT 3;

-- 6. Final verification
SELECT 'Final Verification - Invitations Should Work Correctly:' as result;
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS - No invited applications in Save For Later tab'
        ELSE '❌ FAILED - Some invited applications still in Save For Later tab'
    END as status,
    COUNT(*) as invited_apps_in_save_for_later
FROM producer_applications 
WHERE status = 'invited' AND requires_review = true;

-- 7. Show current status distribution
SELECT 'Current Status Distribution:' as info;
SELECT 
    status,
    requires_review,
    COUNT(*) as count
FROM producer_applications 
GROUP BY status, requires_review
ORDER BY count DESC;
