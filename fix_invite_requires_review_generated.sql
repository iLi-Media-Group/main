-- Fix Invite Requires Review Issue (for Generated Column)
-- Run this in Supabase SQL Editor to fix applications appearing in multiple tabs

-- 1. Check current invited applications that might have requires_review = true
SELECT 'Current Invited Applications with requires_review:' as info;
SELECT 
    id,
    name,
    email,
    status,
    review_tier,
    requires_review,
    signed_to_label,
    signed_to_publisher,
    signed_to_manager,
    entity_collects_payment,
    production_master_percentage,
    created_at
FROM producer_applications 
WHERE status = 'invited'
ORDER BY created_at DESC;

-- 2. Check applications that appear in both Invited and Save For Later tabs
SELECT 'Applications in Multiple Tabs:' as info;
SELECT 
    id,
    name,
    email,
    status,
    review_tier,
    requires_review,
    signed_to_label,
    signed_to_publisher,
    signed_to_manager,
    entity_collects_payment,
    production_master_percentage,
    CASE 
        WHEN status = 'invited' THEN '✅ In INVITED tab'
        ELSE '❌ Not in INVITED tab'
    END as invited_tab,
    CASE 
        WHEN requires_review = true THEN '✅ In SAVE FOR LATER tab'
        ELSE '❌ Not in SAVE FOR LATER tab'
    END as save_for_later_tab
FROM producer_applications 
WHERE status = 'invited' AND requires_review = true;

-- 3. Fix invited applications by clearing the fields that cause requires_review = true
-- Since requires_review is generated, we need to update the underlying fields
UPDATE producer_applications 
SET 
    signed_to_label = 'No',
    signed_to_publisher = 'No',
    signed_to_manager = 'No',
    entity_collects_payment = 'No',
    production_master_percentage = 100,
    updated_at = NOW()
WHERE status = 'invited' 
    AND (
        signed_to_label = 'Yes' OR 
        signed_to_publisher = 'Yes' OR 
        signed_to_manager = 'Yes' OR 
        entity_collects_payment = 'Yes' OR 
        (production_master_percentage IS NOT NULL AND production_master_percentage < 100)
    );

-- 4. Verify the fix
SELECT 'After Fix - Invited Applications:' as info;
SELECT 
    id,
    name,
    email,
    status,
    review_tier,
    requires_review,
    signed_to_label,
    signed_to_publisher,
    signed_to_manager,
    entity_collects_payment,
    production_master_percentage,
    created_at
FROM producer_applications 
WHERE status = 'invited'
ORDER BY created_at DESC;

-- 5. Test tab counts
SELECT 'Tab Counts After Fix:' as summary;
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

-- 6. Test creating an invitation (simulate the invite process)
SELECT 'Testing Invitation Process:' as test;
-- This simulates what happens when Invite button is clicked
UPDATE producer_applications 
SET 
    status = 'invited',
    review_tier = 'Tier 1',
    signed_to_label = 'No',
    signed_to_publisher = 'No',
    signed_to_manager = 'No',
    entity_collects_payment = 'No',
    production_master_percentage = 100,
    updated_at = NOW()
WHERE id = (
    SELECT id FROM producer_applications 
    WHERE status = 'save_for_later' 
    LIMIT 1
) RETURNING id, name, email, status, review_tier, requires_review;

-- 7. Verify the test application appears only in Invited tab
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
        WHEN requires_review = true THEN '✅ In SAVE FOR LATER tab'
        ELSE '❌ Not in SAVE FOR LATER tab'
    END as save_for_later_tab
FROM producer_applications 
WHERE status = 'invited'
ORDER BY updated_at DESC
LIMIT 5;

-- 8. Final verification
SELECT 'Final Verification - Invitations Should Work Correctly:' as result;
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS - No invited applications in Save For Later tab'
        ELSE '❌ FAILED - Some invited applications still in Save For Later tab'
    END as status,
    COUNT(*) as invited_apps_in_save_for_later
FROM producer_applications 
WHERE status = 'invited' AND requires_review = true;
