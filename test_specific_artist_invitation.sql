-- Test Specific Artist Invitation
-- Replace 'INVITATION_CODE_HERE' with the actual invitation code being used
-- Replace 'EMAIL_HERE' with the actual email being used

-- ============================================
-- 1. TEST WITH ACTUAL INVITATION CODE
-- ============================================

-- Replace these values with the actual invitation code and email being used
DO $$
DECLARE
    test_code text := 'INVITATION_CODE_HERE';  -- Replace with actual code
    test_email text := 'EMAIL_HERE';           -- Replace with actual email
    validation_result boolean;
BEGIN
    RAISE NOTICE 'Testing invitation code: %', test_code;
    RAISE NOTICE 'Testing email: %', test_email;
    
    -- Test the validation function
    validation_result := validate_artist_invitation(test_code, test_email);
    RAISE NOTICE 'Validation result: %', validation_result;
    
    -- Check if invitation exists in database
    IF EXISTS (
        SELECT 1 FROM artist_invitations 
        WHERE invitation_code = test_code
    ) THEN
        RAISE NOTICE 'Invitation code EXISTS in database';
        
        -- Show invitation details
        RAISE NOTICE 'Invitation details:';
        RAISE NOTICE 'Email: %', (SELECT email FROM artist_invitations WHERE invitation_code = test_code);
        RAISE NOTICE 'Used: %', (SELECT used FROM artist_invitations WHERE invitation_code = test_code);
        RAISE NOTICE 'Expires: %', (SELECT expires_at FROM artist_invitations WHERE invitation_code = test_code);
        RAISE NOTICE 'Created: %', (SELECT created_at FROM artist_invitations WHERE invitation_code = test_code);
    ELSE
        RAISE NOTICE 'Invitation code DOES NOT EXIST in database';
    END IF;
END $$;

-- ============================================
-- 2. SHOW ALL VALID INVITATIONS
-- ============================================

SELECT 'All valid artist invitations:' as info;
SELECT 
    invitation_code,
    email,
    first_name,
    last_name,
    artist_number,
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
-- 3. CREATE A WORKING TEST INVITATION
-- ============================================

-- Create a guaranteed working test invitation
INSERT INTO artist_invitations (
    email,
    first_name,
    last_name,
    artist_number,
    invitation_code,
    created_by
) VALUES (
    'working-test@example.com',
    'Working',
    'Test',
    'MBAR-100',
    'WORKING_TEST_100',
    (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT (invitation_code) DO NOTHING;

-- Test the working invitation
SELECT 'Testing working invitation:' as info;
SELECT 
    'WORKING_TEST_100' as invitation_code,
    'working-test@example.com' as email,
    validate_artist_invitation('WORKING_TEST_100', 'working-test@example.com') as is_valid;

-- ============================================
-- 4. DIRECT DATABASE QUERY TEST
-- ============================================

-- Test the exact query that SignupForm.tsx does
SELECT 'Direct database query test (what SignupForm does):' as info;
SELECT 
    artist_number
FROM artist_invitations 
WHERE invitation_code = 'WORKING_TEST_100'
LIMIT 1;

-- ============================================
-- 5. RLS POLICY TEST
-- ============================================

-- Test if RLS policies are blocking access
SELECT 'Testing RLS policies:' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'artist_invitations';

-- ============================================
-- 6. FUNCTION PERMISSION TEST
-- ============================================

-- Test function permissions
SELECT 'Function permissions:' as info;
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name = 'validate_artist_invitation';

-- ============================================
-- 7. FINAL WORKING TEST CODES
-- ============================================

SELECT 'Available working test codes:' as info;
SELECT 
    invitation_code,
    email,
    'Use this code for testing' as instruction
FROM artist_invitations 
WHERE used = FALSE 
AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY created_at DESC
LIMIT 5;
