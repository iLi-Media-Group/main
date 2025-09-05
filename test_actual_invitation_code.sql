-- Test Actual Invitation Code
-- Testing the specific invitation code that's failing: aqe8yf859sla6fs2l58y

-- ============================================
-- 1. TEST THE ACTUAL INVITATION CODE
-- ============================================

-- Test with the actual invitation code
DO $$
DECLARE
    test_code text := 'aqe8yf859sla6fs2l58y';  -- The actual failing code
    test_email text := 'test@example.com';      -- Replace with actual email
    validation_result boolean;
BEGIN
    RAISE NOTICE 'Testing actual invitation code: %', test_code;
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
        RAISE NOTICE 'Artist Number: %', (SELECT artist_number FROM artist_invitations WHERE invitation_code = test_code);
    ELSE
        RAISE NOTICE 'Invitation code DOES NOT EXIST in database';
    END IF;
END $$;

-- ============================================
-- 2. SHOW THE ACTUAL INVITATION DETAILS
-- ============================================

SELECT 'Actual invitation details:' as info;
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
WHERE invitation_code = 'aqe8yf859sla6fs2l58y';

-- ============================================
-- 3. TEST VALIDATION WITH DIFFERENT EMAILS
-- ============================================

SELECT 'Testing validation with different emails:' as info;
SELECT 
    'aqe8yf859sla6fs2l58y' as invitation_code,
    'test@example.com' as email,
    validate_artist_invitation('aqe8yf859sla6fs2l58y', 'test@example.com') as is_valid;

-- Test with the actual email from the invitation
SELECT 
    'aqe8yf859sla6fs2l58y' as invitation_code,
    (SELECT email FROM artist_invitations WHERE invitation_code = 'aqe8yf859sla6fs2l58y') as actual_email,
    validate_artist_invitation('aqe8yf859sla6fs2l58y', (SELECT email FROM artist_invitations WHERE invitation_code = 'aqe8yf859sla6fs2l58y')) as is_valid;

-- ============================================
-- 4. TEST DIRECT QUERY (what SignupForm does)
-- ============================================

SELECT 'Direct database query test (what SignupForm does):' as info;
SELECT 
    artist_number
FROM artist_invitations 
WHERE invitation_code = 'aqe8yf859sla6fs2l58y'
LIMIT 1;

-- ============================================
-- 5. CHECK IF INVITATION IS ALREADY USED
-- ============================================

SELECT 'Checking if invitation is already used:' as info;
SELECT 
    invitation_code,
    email,
    used,
    used_at,
    created_at,
    expires_at,
    CASE 
        WHEN used = TRUE THEN 'Already used'
        WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'Expired'
        ELSE 'Valid'
    END as status
FROM artist_invitations 
WHERE invitation_code = 'aqe8yf859sla6fs2l58y';

-- ============================================
-- 6. CREATE A NEW WORKING INVITATION
-- ============================================

-- Create a new working invitation for testing
INSERT INTO artist_invitations (
    email,
    first_name,
    last_name,
    artist_number,
    invitation_code,
    created_by
) VALUES (
    'new-test@example.com',
    'New',
    'Test',
    'MBAR-101',
    'NEW_WORKING_101',
    (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT (invitation_code) DO NOTHING;

-- Test the new invitation
SELECT 'Testing new working invitation:' as info;
SELECT 
    'NEW_WORKING_101' as invitation_code,
    'new-test@example.com' as email,
    validate_artist_invitation('NEW_WORKING_101', 'new-test@example.com') as is_valid;

-- ============================================
-- 7. FINAL WORKING TEST CODES
-- ============================================

SELECT 'Available working test codes:' as info;
SELECT 
    invitation_code,
    email,
    artist_number,
    'Use this code for testing' as instruction
FROM artist_invitations 
WHERE used = FALSE 
AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY created_at DESC
LIMIT 5;
