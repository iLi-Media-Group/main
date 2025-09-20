-- Test New Applications Tab Fix
-- Run this after the fix to verify it works

-- 1. Test the exact frontend query for "New" tab
SELECT 'Testing Frontend NEW Tab Query:' as test;
SELECT 
    id,
    name,
    email,
    status,
    is_auto_rejected,
    requires_review,
    created_at
FROM producer_applications 
WHERE (status = 'new' OR status IS NULL)
    AND (requires_review IS NULL OR requires_review = false)
    AND (is_auto_rejected IS NULL OR is_auto_rejected = false)
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
    'DECLINED tab' as tab_name,
    COUNT(*) as count
FROM producer_applications 
WHERE status = 'declined' OR is_auto_rejected = true

UNION ALL

SELECT 
    'ALL tab' as tab_name,
    COUNT(*) as count
FROM producer_applications;

-- 3. Test creating a new application (simulate form submission)
SELECT 'Simulating New Application Creation:' as test;
-- This simulates what happens when a new application is submitted
INSERT INTO producer_applications (
    name,
    email,
    primary_genre,
    status,
    is_auto_rejected,
    requires_review,
    created_at
) VALUES (
    'Test Producer',
    'test@example.com',
    'Hip Hop',
    'new',
    false,
    false,
    NOW()
) RETURNING id, name, email, status, is_auto_rejected, requires_review;

-- 4. Verify the test application appears in NEW tab
SELECT 'Verifying Test Application in NEW Tab:' as test;
SELECT 
    id,
    name,
    email,
    status,
    is_auto_rejected,
    requires_review,
    created_at
FROM producer_applications 
WHERE email = 'test@example.com'
    AND (status = 'new' OR status IS NULL)
    AND (requires_review IS NULL OR requires_review = false)
    AND (is_auto_rejected IS NULL OR is_auto_rejected = false);

-- 5. Clean up test data
DELETE FROM producer_applications WHERE email = 'test@example.com';

-- 6. Final verification
SELECT 'Final Verification - NEW Tab Should Work:' as result;
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ SUCCESS - New applications will show in NEW tab'
        ELSE '❌ FAILED - No applications in NEW tab'
    END as status,
    COUNT(*) as applications_in_new_tab
FROM producer_applications 
WHERE (status = 'new' OR status IS NULL)
    AND (requires_review IS NULL OR requires_review = false)
    AND (is_auto_rejected IS NULL OR is_auto_rejected = false);
