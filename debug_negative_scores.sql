-- Debug Negative Scores Issue
-- This script investigates why applications with negative scores aren't being auto-declined

-- ============================================
-- 1. CHECK ALL APPLICATIONS WITH SCORES
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

-- ============================================
-- 2. CHECK SPECIFIC APPLICATIONS FROM DASHBOARD
-- ============================================

-- Check Test Apply (should have -13 points)
SELECT 
    'Test Apply details:' as info;
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
WHERE name = 'Test Apply' OR email = 'test@example.com';

-- Check Jane Smith (should have -20 points)
SELECT 
    'Jane Smith details:' as info;
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
WHERE name = 'Jane Smith' OR email = 'producer@example.com';

-- ============================================
-- 3. MANUALLY UPDATE NEGATIVE SCORES
-- ============================================

-- Update Test Apply to have -13 points
UPDATE producer_applications 
SET score = -13
WHERE name = 'Test Apply' OR email = 'test@example.com';

-- Update Jane Smith to have -20 points
UPDATE producer_applications 
SET score = -20
WHERE name = 'Jane Smith' OR email = 'producer@example.com';

-- ============================================
-- 4. APPLY AUTO-DECLINE LOGIC
-- ============================================

-- Decline applications with negative scores
UPDATE producer_applications 
SET 
    status = 'declined',
    is_auto_rejected = true,
    auto_disqualified = true
WHERE score < 0;

-- ============================================
-- 5. VERIFY THE FIXES
-- ============================================

-- Show final state of all applications
SELECT 
    'Final state of all applications:' as info;
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

-- Show only declined applications
SELECT 
    'Declined applications:' as info;
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