-- Test Artist Invitation Fix
-- Run this AFTER running fix_artist_invitation_system.sql to verify everything works

-- ============================================
-- 1. TEST BASIC SYSTEM COMPONENTS
-- ============================================

SELECT 'Testing basic system components...' as test_step;

-- Test 1: Check if table exists
SELECT 'Test 1: Table exists' as test_name;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'artist_invitations'
) as table_exists;

-- Test 2: Check if validation function exists
SELECT 'Test 2: Validation function exists' as test_name;
SELECT EXISTS (
    SELECT FROM pg_proc WHERE proname = 'validate_artist_invitation'
) as function_exists;

-- Test 3: Check if test invitation exists
SELECT 'Test 3: Test invitation exists' as test_name;
SELECT EXISTS (
    SELECT FROM artist_invitations WHERE invitation_code = 'TEST_ARTIST_001'
) as test_invitation_exists;

-- ============================================
-- 2. TEST VALIDATION FUNCTION
-- ============================================

SELECT 'Testing validation function...' as test_step;

-- Test with valid invitation
SELECT 'Test 4: Valid invitation validation' as test_name;
SELECT 
    'TEST_ARTIST_001' as invitation_code,
    'testartist@example.com' as email,
    validate_artist_invitation('TEST_ARTIST_001', 'testartist@example.com') as is_valid;

-- Test with invalid invitation
SELECT 'Test 5: Invalid invitation validation' as test_name;
SELECT 
    'INVALID_CODE' as invitation_code,
    'testartist@example.com' as email,
    validate_artist_invitation('INVALID_CODE', 'testartist@example.com') as is_valid;

-- Test with wrong email
SELECT 'Test 6: Wrong email validation' as test_name;
SELECT 
    'TEST_ARTIST_001' as invitation_code,
    'wrongemail@example.com' as email,
    validate_artist_invitation('TEST_ARTIST_001', 'wrongemail@example.com') as is_valid;

-- ============================================
-- 3. TEST ARTIST NUMBER GENERATION
-- ============================================

SELECT 'Testing artist number generation...' as test_step;

-- Test get_next_artist_number function
SELECT 'Test 7: Next artist number generation' as test_name;
SELECT get_next_artist_number() as next_artist_number;

-- ============================================
-- 4. TEST RLS POLICIES
-- ============================================

SELECT 'Testing RLS policies...' as test_step;

-- Check if public read policy exists
SELECT 'Test 8: Public read policy exists' as test_name;
SELECT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'artist_invitations' 
    AND policyname = 'Allow public read for validation'
) as public_read_policy_exists;

-- ============================================
-- 5. TEST DIRECT QUERY (what SignupForm does)
-- ============================================

SELECT 'Testing direct query (SignupForm simulation)...' as test_step;

-- Simulate the exact query that SignupForm.tsx does
SELECT 'Test 9: Direct invitation lookup' as test_name;
SELECT 
    artist_number
FROM artist_invitations 
WHERE invitation_code = 'TEST_ARTIST_001'
LIMIT 1;

-- ============================================
-- 6. CREATE A REAL TEST INVITATION
-- ============================================

SELECT 'Creating a real test invitation...' as test_step;

-- Create a real test invitation
INSERT INTO artist_invitations (
  email,
  first_name,
  last_name,
  artist_number,
  invitation_code,
  created_by
) VALUES (
  'realtest@example.com',
  'Real',
  'Test',
  'MBAR-02',
  'REAL_TEST_002',
  (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT (invitation_code) DO NOTHING;

-- Test the real invitation
SELECT 'Test 10: Real invitation validation' as test_name;
SELECT 
    'REAL_TEST_002' as invitation_code,
    'realtest@example.com' as email,
    validate_artist_invitation('REAL_TEST_002', 'realtest@example.com') as is_valid;

-- ============================================
-- 7. FINAL VERIFICATION
-- ============================================

SELECT 'Final verification...' as test_step;

-- Show all invitations
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
    expires_at
FROM artist_invitations 
ORDER BY created_at DESC;

-- Test all validation functions
SELECT 'All validation test results:' as info;
SELECT 
    invitation_code,
    email,
    validate_artist_invitation(invitation_code, email) as is_valid
FROM artist_invitations;

-- ============================================
-- 8. SUMMARY
-- ============================================

SELECT 'Test Summary:' as summary;
SELECT 
    'If all tests above show TRUE/valid results, the artist invitation system is working correctly.' as status,
    'You can now create artist invitations and test the signup process.' as next_steps,
    'Test invitation codes available: TEST_ARTIST_001, REAL_TEST_002' as test_codes;
