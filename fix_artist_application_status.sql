-- Fix Artist Application Status
-- Update the application status from "invited" to "approved"

-- ============================================
-- 1. CHECK CURRENT STATUS
-- ============================================

SELECT 'Current application status:' as info;
SELECT 
    id,
    name,
    email,
    status,
    created_at,
    updated_at
FROM artist_applications 
WHERE email = 'test@example.com';

-- ============================================
-- 2. UPDATE STATUS TO APPROVED
-- ============================================

UPDATE artist_applications 
SET 
    status = 'approved',
    updated_at = NOW()
WHERE email = 'test@example.com';

-- ============================================
-- 3. VERIFY THE UPDATE
-- ============================================

SELECT 'Updated application status:' as info;
SELECT 
    id,
    name,
    email,
    status,
    created_at,
    updated_at
FROM artist_applications 
WHERE email = 'test@example.com';

-- ============================================
-- 4. CHECK ALL INVITED APPLICATIONS
-- ============================================

SELECT 'All applications with "invited" status:' as info;
SELECT 
    id,
    name,
    email,
    status,
    created_at
FROM artist_applications 
WHERE status = 'invited'
ORDER BY created_at DESC;

-- ============================================
-- 5. SUGGESTED BULK UPDATE
-- ============================================

SELECT 'Suggested bulk update for all invited applications:' as info;
SELECT 'UPDATE artist_applications SET status = "approved", updated_at = NOW() WHERE status = "invited";' as suggested_query;
