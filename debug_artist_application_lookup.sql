-- Debug Artist Application Lookup
-- This will help us understand why the application lookup is failing

-- ============================================
-- 1. CHECK THE ARTIST APPLICATIONS TABLE
-- ============================================

SELECT 'All artist applications:' as info;
SELECT 
    id,
    name,
    email,
    artist_type,
    primary_genre,
    status,
    application_score,
    created_at,
    updated_at
FROM artist_applications 
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 2. CHECK FOR THE SPECIFIC EMAIL
-- ============================================

SELECT 'Looking for test@example.com application:' as info;
SELECT 
    id,
    name,
    email,
    artist_type,
    primary_genre,
    status,
    application_score,
    created_at,
    updated_at
FROM artist_applications 
WHERE email = 'test@example.com'
ORDER BY created_at DESC;

-- ============================================
-- 3. CHECK THE PROFILES TABLE FOR THE ARTIST
-- ============================================

SELECT 'Artist profile in profiles table:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    account_type,
    artist_number,
    created_at
FROM profiles 
WHERE email = 'test@example.com'
ORDER BY created_at DESC;

-- ============================================
-- 4. CHECK IF THERE ARE ANY APPLICATIONS WITH SIMILAR EMAILS
-- ============================================

SELECT 'Applications with similar emails:' as info;
SELECT 
    id,
    name,
    email,
    status,
    created_at
FROM artist_applications 
WHERE email LIKE '%test%' OR email LIKE '%example%'
ORDER BY created_at DESC;

-- ============================================
-- 5. CHECK THE ARTIST INVITATION
-- ============================================

SELECT 'Artist invitation details:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    artist_number,
    invitation_code,
    used,
    created_at
FROM artist_invitations 
WHERE email = 'test@example.com'
ORDER BY created_at DESC;

-- ============================================
-- 6. SUGGESTED FIX
-- ============================================

SELECT 'Suggested fix - Create application record:' as info;
SELECT 'If no application exists, we need to create one with status = "approved"' as instruction;
