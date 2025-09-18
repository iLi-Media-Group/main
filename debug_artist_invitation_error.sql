-- Debug Artist Invitation Error
-- This script will help identify why the "Invalid or expired artist invitation code" error persists
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CHECK CURRENT SYSTEM STATUS
-- ============================================

SELECT '=== CURRENT SYSTEM STATUS ===' as section;

-- Check if artist_invitations table exists
SELECT '1. Artist invitations table exists:' as check_item;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'artist_invitations'
) as table_exists;

-- Check if validate_artist_invitation function exists
SELECT '2. Validate function exists:' as check_item;
SELECT EXISTS (
    SELECT FROM pg_proc WHERE proname = 'validate_artist_invitation'
) as function_exists;

-- ============================================
-- 2. CHECK EXISTING INVITATIONS
-- ============================================

SELECT '=== EXISTING INVITATIONS ===' as section;

-- Show all artist invitations
SELECT 'All artist invitations:' as info;
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
-- 3. TEST VALIDATION FUNCTION
-- ============================================

SELECT '=== VALIDATION FUNCTION TESTS ===' as section;

-- Test with each existing invitation
SELECT 'Testing validation function with existing invitations:' as info;
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
-- 4. CHECK RLS POLICIES
-- ============================================

SELECT '=== RLS POLICIES ===' as section;

-- Show RLS policies for artist_invitations
SELECT 'RLS policies for artist_invitations:' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'artist_invitations';

-- ============================================
-- 5. TEST DIRECT QUERY (what the function does)
-- ============================================

SELECT '=== DIRECT QUERY TEST ===' as section;

-- Test the exact query that the validation function does
SELECT 'Direct query test (what validation function does):' as info;
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
-- 6. CREATE A FRESH TEST INVITATION
-- ============================================

SELECT '=== CREATING FRESH TEST INVITATION ===' as section;

-- Create a fresh test invitation
INSERT INTO artist_invitations (
    email,
    first_name,
    last_name,
    artist_number,
    invitation_code,
    created_by
) VALUES (
    'fresh-test@example.com',
    'Fresh',
    'Test',
    'MBAR-99',
    'FRESH_TEST_999',
    (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT (invitation_code) DO NOTHING;

-- Test the fresh invitation
SELECT 'Testing fresh invitation:' as info;
SELECT 
    'FRESH_TEST_999' as invitation_code,
    'fresh-test@example.com' as email,
    validate_artist_invitation('FRESH_TEST_999', 'fresh-test@example.com') as is_valid;

-- ============================================
-- 7. CHECK FUNCTION DEFINITION
-- ============================================

SELECT '=== FUNCTION DEFINITION ===' as section;

-- Show the current function definition
SELECT 'Current validate_artist_invitation function definition:' as info;
SELECT 
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'validate_artist_invitation';

-- ============================================
-- 8. TEST WITH SPECIFIC INVITATION CODE
-- ============================================

SELECT '=== SPECIFIC INVITATION TEST ===' as section;

-- Test with a specific invitation code (replace with the actual code being used)
SELECT 'Test with specific invitation code:' as info;
-- Replace 'ACTUAL_INVITATION_CODE' with the real invitation code being used
SELECT 
    'ACTUAL_INVITATION_CODE' as invitation_code,
    'test@example.com' as email,
    validate_artist_invitation('ACTUAL_INVITATION_CODE', 'test@example.com') as is_valid;

-- ============================================
-- 9. CHECK FUNCTION PERMISSIONS
-- ============================================

SELECT '=== FUNCTION PERMISSIONS ===' as section;

-- Check function permissions
SELECT 'Function permissions:' as info;
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name = 'validate_artist_invitation';

-- ============================================
-- 10. RECREATE FUNCTION WITH DEBUGGING
-- ============================================

SELECT '=== RECREATING FUNCTION WITH DEBUGGING ===' as section;

-- Drop and recreate the function with better error handling
DROP FUNCTION IF EXISTS validate_artist_invitation(text, text);
CREATE OR REPLACE FUNCTION validate_artist_invitation(code text, email_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_exists boolean;
    debug_info text;
BEGIN
    -- Add debugging
    debug_info := 'Code: ' || code || ', Email: ' || email_address;
    RAISE NOTICE 'validate_artist_invitation called with: %', debug_info;
    
    -- Check if invitation exists and is valid
    SELECT EXISTS (
        SELECT 1 FROM artist_invitations
        WHERE invitation_code = validate_artist_invitation.code
        AND (email IS NULL OR email = validate_artist_invitation.email_address)
        AND NOT used
        AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO invitation_exists;
    
    RAISE NOTICE 'Validation result: %', invitation_exists;
    
    RETURN invitation_exists;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION validate_artist_invitation(text, text) TO public;

-- Test the recreated function
SELECT 'Testing recreated function:' as info;
SELECT 
    'FRESH_TEST_999' as invitation_code,
    'fresh-test@example.com' as email,
    validate_artist_invitation('FRESH_TEST_999', 'fresh-test@example.com') as is_valid;

-- ============================================
-- 11. FINAL DIAGNOSIS
-- ============================================

SELECT '=== FINAL DIAGNOSIS ===' as section;

SELECT 'Available test invitation codes:' as info;
SELECT 
    invitation_code,
    email,
    CASE 
        WHEN used = TRUE THEN 'Already used'
        WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'Expired'
        ELSE 'Valid'
    END as status
FROM artist_invitations 
WHERE used = FALSE 
AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY created_at DESC;
