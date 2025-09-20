-- Fix Score Cutoff Decline Logic
-- This script auto-declines applications with 4 points or less

-- ============================================
-- 1. CHECK CURRENT SCORES AND STATUS
-- ============================================

-- Show all applications with their scores
SELECT 
    'All applications with scores:' as info;
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
ORDER BY score ASC;

-- Show applications with 4 points or less
SELECT 
    'Applications with 4 points or less:' as info;
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
WHERE score <= 4
ORDER BY score ASC;

-- ============================================
-- 2. AUTO-DECLINE APPLICATIONS WITH 4 POINTS OR LESS
-- ============================================

-- Update applications with 4 points or less to declined status
UPDATE producer_applications 
SET 
    status = 'declined',
    is_auto_rejected = true,
    auto_disqualified = true
WHERE score <= 4;

-- ============================================
-- 3. VERIFY THE CHANGES
-- ============================================

-- Check how many applications were declined
SELECT 
    'Applications declined due to low scores (≤4):' as info;
SELECT 
    COUNT(*) as declined_count
FROM producer_applications 
WHERE score <= 4 
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
ORDER BY score ASC;

-- Show remaining active applications (non-declined)
SELECT 
    'Remaining active applications (score > 4):' as info;
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
ORDER BY score DESC;

-- ============================================
-- 4. SUMMARY
-- ============================================

-- Show summary by score ranges (FIXED)
SELECT 
    'Summary by score ranges:' as info;
SELECT 
    score_range,
    COUNT(*) as application_count,
    COUNT(CASE WHEN status = 'declined' THEN 1 END) as declined_count,
    COUNT(CASE WHEN status = 'new' THEN 1 END) as active_count
FROM (
    SELECT 
        score,
        status,
        CASE 
            WHEN score <= 0 THEN '0 or negative'
            WHEN score <= 4 THEN '1-4 points'
            WHEN score <= 10 THEN '5-10 points'
            WHEN score <= 20 THEN '11-20 points'
            ELSE '20+ points'
        END as score_range
    FROM producer_applications
) as score_ranges
GROUP BY score_range
ORDER BY 
    CASE score_range
        WHEN '0 or negative' THEN 1
        WHEN '1-4 points' THEN 2
        WHEN '5-10 points' THEN 3
        WHEN '11-20 points' THEN 4
        ELSE 5
    END; 