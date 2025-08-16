-- Fix Manual Review Status Issue
-- Run this in Supabase SQL Editor to fix the manual review functionality

-- 1. Check current applications with manual review status
SELECT 'Current Manual Review Applications:' as info;
SELECT 
    id,
    name,
    email,
    status,
    manual_review,
    manual_review_approved,
    created_at
FROM producer_applications 
WHERE status IN ('manual_review', 'in_review') 
   OR manual_review = true
ORDER BY created_at DESC;

-- 2. Fix applications that should be in manual review
-- Set proper status for manual review applications
UPDATE producer_applications 
SET 
    status = 'in_review',
    manual_review = true,
    manual_review_approved = false
WHERE status = 'manual_review';

-- 3. Ensure manual review applications have correct flags
UPDATE producer_applications 
SET 
    manual_review = true,
    manual_review_approved = false
WHERE status = 'in_review' 
   AND (manual_review IS NULL OR manual_review = false);

-- 4. Test the manual review tab query
SELECT 'Testing Manual Review Tab Query:' as test;
SELECT 
    COUNT(*) as applications_in_manual_review_tab
FROM producer_applications 
WHERE status = 'in_review';

-- 5. Show final manual review applications
SELECT 'Final Manual Review Applications:' as info;
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

-- 6. Test creating a manual review application
SELECT 'Testing Manual Review Creation:' as test;
-- This simulates what happens when Manual Review button is clicked
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

-- 7. Verify the test application appears in manual review tab
SELECT 'Verifying Test Application in Manual Review Tab:' as test;
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

-- 8. Show status distribution
SELECT 'Final Status Distribution:' as info;
SELECT 
    status,
    manual_review,
    manual_review_approved,
    COUNT(*) as count
FROM producer_applications 
GROUP BY status, manual_review, manual_review_approved
ORDER BY count DESC;
