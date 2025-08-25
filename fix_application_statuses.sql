-- Fix Application Statuses to Match Frontend Expectations
-- The frontend expects specific status values and review_tier combinations

-- First, see current status distribution
SELECT 'Current Status Distribution:' as info;
SELECT 
    status,
    review_tier,
    COUNT(*) as count
FROM producer_applications 
GROUP BY status, review_tier
ORDER BY count DESC;

-- Show all applications with their current status
SELECT 'All Applications Current State:' as info;
SELECT 
    id,
    name,
    email,
    status,
    review_tier,
    created_at
FROM producer_applications 
ORDER BY created_at DESC;

-- Fix status values to match frontend expectations
-- Frontend expects: 'new', 'invited', 'save_for_later', 'declined'
-- And for 'new' tab: status = 'new' AND review_tier IS NULL

-- Set all applications to 'new' status with null review_tier
UPDATE producer_applications 
SET 
    status = 'new',
    review_tier = NULL
WHERE status IS NULL OR status NOT IN ('invited', 'save_for_later', 'declined');

-- Set one application to 'invited' for testing
UPDATE producer_applications 
SET 
    status = 'invited',
    review_tier = 'tier_1'
WHERE email = 'mike.composer@example.com';

-- Verify the changes
SELECT 'After Fixing Statuses:' as info;
SELECT 
    status,
    review_tier,
    COUNT(*) as count
FROM producer_applications 
GROUP BY status, review_tier
ORDER BY count DESC;

-- Show final applications
SELECT 'Final Applications:' as info;
SELECT 
    id,
    name,
    email,
    status,
    review_tier,
    created_at
FROM producer_applications 
ORDER BY created_at DESC;

-- Test the frontend query logic
SELECT 'Applications for NEW tab (status=new AND review_tier IS NULL):' as info;
SELECT COUNT(*) as count FROM producer_applications 
WHERE status = 'new' AND review_tier IS NULL;

SELECT 'Applications for INVITED tab (status=invited):' as info;
SELECT COUNT(*) as count FROM producer_applications 
WHERE status = 'invited'; 