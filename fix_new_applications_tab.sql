-- Fix New Applications Tab Issue
-- Run this in Supabase SQL Editor to diagnose and fix the problem

-- 1. Check current application statuses and why they're not showing in "New" tab
SELECT 'Current Application Statuses:' as info;
SELECT 
    id,
    name,
    email,
    status,
    is_auto_rejected,
    requires_review,
    review_tier,
    created_at,
    CASE 
        WHEN status = 'new' AND is_auto_rejected = false AND requires_review = false THEN '✅ Should show in NEW tab'
        WHEN status = 'new' AND is_auto_rejected = true THEN '❌ Auto-rejected - should be in DECLINED tab'
        WHEN status = 'new' AND requires_review = true THEN '❌ Requires review - should be in SAVE FOR LATER tab'
        WHEN status IS NULL THEN '❌ NULL status - needs fixing'
        ELSE '❓ Other status - check logic'
    END as tab_assignment
FROM producer_applications 
ORDER BY created_at DESC;

-- 2. Check which applications should be in "New" tab but aren't
SELECT 'Applications that SHOULD be in NEW tab:' as info;
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
    AND (is_auto_rejected IS NULL OR is_auto_rejected = false)
    AND (requires_review IS NULL OR requires_review = false);

-- 3. Check which applications are incorrectly excluded from "New" tab
SELECT 'Applications incorrectly excluded from NEW tab:' as info;
SELECT 
    id,
    name,
    email,
    status,
    is_auto_rejected,
    requires_review,
    created_at,
    CASE 
        WHEN requires_review = true THEN 'requires_review = true'
        WHEN is_auto_rejected = true THEN 'is_auto_rejected = true'
        WHEN status != 'new' AND status IS NOT NULL THEN 'status != new'
        ELSE 'Unknown reason'
    END as exclusion_reason
FROM producer_applications 
WHERE (status = 'new' OR status IS NULL)
    AND (
        (is_auto_rejected = true) OR 
        (requires_review = true) OR
        (status != 'new' AND status IS NOT NULL)
    );

-- 4. Fix applications that should be in "New" tab
-- Set proper status and flags for new applications
UPDATE producer_applications 
SET 
    status = 'new',
    is_auto_rejected = false,
    requires_review = false
WHERE (status IS NULL OR status = 'new')
    AND (is_auto_rejected IS NULL OR is_auto_rejected = false)
    AND (requires_review IS NULL OR requires_review = false);

-- 5. Verify the fix
SELECT 'After fixing - Applications that SHOULD be in NEW tab:' as info;
SELECT 
    id,
    name,
    email,
    status,
    is_auto_rejected,
    requires_review,
    created_at
FROM producer_applications 
WHERE status = 'new'
    AND is_auto_rejected = false
    AND requires_review = false
ORDER BY created_at DESC;

-- 6. Test the exact query that the frontend uses for "New" tab
SELECT 'Testing frontend NEW tab query:' as info;
SELECT 
    COUNT(*) as applications_in_new_tab
FROM producer_applications 
WHERE (status = 'new' OR status IS NULL)
    AND (requires_review IS NULL OR requires_review = false)
    AND (is_auto_rejected IS NULL OR is_auto_rejected = false);

-- 7. Show final status distribution
SELECT 'Final Status Distribution:' as info;
SELECT 
    status,
    is_auto_rejected,
    requires_review,
    COUNT(*) as count
FROM producer_applications 
GROUP BY status, is_auto_rejected, requires_review
ORDER BY count DESC;
