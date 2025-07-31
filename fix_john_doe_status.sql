-- Fix John Doe Status
-- John Doe has a neutral score (0) and shouldn't be declined

-- ============================================
-- 1. CHECK JOHN DOE'S CURRENT STATUS
-- ============================================

SELECT 
    'John Doe current status:' as info;
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
WHERE name = 'John Doe' OR email = 'sample@example.com';

-- ============================================
-- 2. FIX JOHN DOE'S STATUS
-- ============================================

-- John Doe has score = 0 (neutral), so he should be 'new' not 'declined'
UPDATE producer_applications 
SET 
    status = 'new',
    is_auto_rejected = false,
    auto_disqualified = false
WHERE (name = 'John Doe' OR email = 'sample@example.com')
AND score = 0;

-- ============================================
-- 3. VERIFY THE FIX
-- ============================================

-- Show John Doe's updated status
SELECT 
    'John Doe updated status:' as info;
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
WHERE name = 'John Doe' OR email = 'sample@example.com';

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