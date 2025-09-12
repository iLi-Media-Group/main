-- Test Artist Invitation System - Specific Check
-- Run this in Supabase SQL Editor to check the exact issue

-- ============================================
-- 1. CHECK IF ARTIST_INVITATIONS TABLE EXISTS
-- ============================================

SELECT 'Step 1: Checking if artist_invitations table exists' as info;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'artist_invitations'
) as table_exists;

-- ============================================
-- 2. CHECK IF VALIDATION FUNCTION EXISTS
-- ============================================

SELECT 'Step 2: Checking if validate_artist_invitation function exists' as info;
SELECT EXISTS (
    SELECT FROM pg_proc WHERE proname = 'validate_artist_invitation'
) as function_exists;

-- ============================================
-- 3. SHOW ALL EXISTING ARTIST INVITATIONS
-- ============================================

SELECT 'Step 3: All existing artist invitations' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    artist_number,
    invitation_code,
    used,
    created_at,
    expires_at,
    CASE 
        WHEN used = TRUE THEN 'Already used'
        WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'Expired'
        ELSE 'Valid'
    END as status
FROM artist_invitations 
ORDER BY created_at DESC;

-- ============================================
-- 4. TEST VALIDATION FUNCTION WITH REAL DATA
-- ============================================

SELECT 'Step 4: Testing validation function with existing invitations' as info;
SELECT 
    invitation_code,
    email,
    used,
    expires_at,
    validate_artist_invitation(invitation_code, email) as validation_result,
    CASE 
        WHEN used = TRUE THEN 'Already used'
        WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'Expired'
        ELSE 'Valid'
    END as expected_status
FROM artist_invitations;

-- ============================================
-- 5. CHECK RLS POLICIES
-- ============================================

SELECT 'Step 5: RLS policies for artist_invitations' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'artist_invitations';

-- ============================================
-- 6. TEST DIRECT QUERY (what the validation function does)
-- ============================================

SELECT 'Step 6: Testing direct query (what validation function does)' as info;
-- This is the exact query that the validation function should be doing
SELECT 
    invitation_code,
    email,
    EXISTS (
        SELECT 1 FROM artist_invitations
        WHERE invitation_code = ai.invitation_code
        AND (email IS NULL OR email = ai.email)
        AND NOT used
        AND (expires_at IS NULL OR expires_at > NOW())
    ) as should_be_valid
FROM artist_invitations ai;

-- ============================================
-- 7. CREATE A TEST INVITATION IF NONE EXISTS
-- ============================================

SELECT 'Step 7: Creating test invitation if none exists' as info;

-- Check if we have any invitations
DO $$
DECLARE
    invitation_count integer;
BEGIN
    SELECT COUNT(*) INTO invitation_count FROM artist_invitations;
    
    IF invitation_count = 0 THEN
        RAISE NOTICE 'No artist invitations found. Creating a test invitation...';
        
        INSERT INTO artist_invitations (
            email,
            first_name,
            last_name,
            artist_number,
            invitation_code,
            created_by
        ) VALUES (
            'testartist@example.com',
            'Test',
            'Artist',
            'MBAR-01',
            'TEST_ARTIST_001',
            (SELECT id FROM auth.users LIMIT 1)
        );
        
        RAISE NOTICE 'Test invitation created with code: TEST_ARTIST_001';
    ELSE
        RAISE NOTICE 'Found % existing artist invitations', invitation_count;
    END IF;
END $$;

-- ============================================
-- 8. FINAL TEST WITH TEST INVITATION
-- ============================================

SELECT 'Step 8: Final test with test invitation' as info;
SELECT 
    invitation_code,
    email,
    validate_artist_invitation(invitation_code, email) as is_valid
FROM artist_invitations 
WHERE invitation_code = 'TEST_ARTIST_001';

-- ============================================
-- 9. SHOW FUNCTION DEFINITION
-- ============================================

SELECT 'Step 9: Current validate_artist_invitation function definition' as info;
SELECT 
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'validate_artist_invitation';
