-- Fix Negative Points Decline Logic
-- This script automatically declines applications with negative scores

-- ============================================
-- 1. CHECK CURRENT SCORES
-- ============================================

-- Show applications with their scores
SELECT 
    'Applications with scores:' as info;
SELECT 
    id,
    name,
    email,
    score,
    status,
    is_auto_rejected,
    auto_disqualified,
    created_at
FROM producer_applications 
WHERE score IS NOT NULL
ORDER BY score ASC;

-- Show applications with negative scores
SELECT 
    'Applications with negative scores:' as info;
SELECT 
    id,
    name,
    email,
    score,
    status,
    is_auto_rejected,
    auto_disqualified,
    created_at
FROM producer_applications 
WHERE score < 0
ORDER BY score ASC;

-- ============================================
-- 2. AUTO-DECLINE NEGATIVE SCORE APPLICATIONS
-- ============================================

-- Update applications with negative scores to declined status
UPDATE producer_applications 
SET 
    status = 'declined',
    is_auto_rejected = true,
    auto_disqualified = true
WHERE score < 0;

-- ============================================
-- 3. VERIFY THE CHANGES
-- ============================================

-- Check how many applications were declined
SELECT 
    'Applications declined due to negative scores:' as info;
SELECT 
    COUNT(*) as declined_count
FROM producer_applications 
WHERE score < 0 
AND status = 'declined';

-- Show all declined applications
SELECT 
    'All declined applications:' as info;
SELECT 
    id,
    name,
    email,
    score,
    status,
    is_auto_rejected,
    auto_disqualified,
    created_at
FROM producer_applications 
WHERE status = 'declined'
ORDER BY created_at DESC;

-- Show remaining active applications (non-declined)
SELECT 
    'Remaining active applications:' as info;
SELECT 
    id,
    name,
    email,
    score,
    status,
    is_auto_rejected,
    auto_disqualified,
    created_at
FROM producer_applications 
WHERE status != 'declined'
ORDER BY created_at DESC; 