-- Restore Invitation from Backup
-- This will move the invitation from artist_invitations_backup to artist_invitations

-- ============================================
-- 1. CHECK THE BACKUP TABLE
-- ============================================

SELECT 'Checking backup table for the invitation:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    artist_number,
    invitation_code,
    used,
    used_at,
    created_at,
    expires_at,
    created_by
FROM artist_invitations_backup 
WHERE invitation_code = 'aqe8yf859sla6fs2l58y';

-- ============================================
-- 2. RESTORE TO MAIN TABLE
-- ============================================

-- Insert the invitation from backup to main table
INSERT INTO artist_invitations (
    id,
    email,
    first_name,
    last_name,
    artist_number,
    invitation_code,
    used,
    used_at,
    created_at,
    expires_at,
    created_by,
    updated_at
)
SELECT 
    id,
    email,
    first_name,
    last_name,
    artist_number,
    invitation_code,
    used,
    used_at,
    created_at,
    expires_at,
    created_by,
    updated_at
FROM artist_invitations_backup 
WHERE invitation_code = 'aqe8yf859sla6fs2l58y'
ON CONFLICT (invitation_code) DO NOTHING;

-- ============================================
-- 3. VERIFY RESTORATION
-- ============================================

SELECT 'Verifying invitation is now in main table:' as info;
SELECT 
    invitation_code,
    email,
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
WHERE invitation_code = 'aqe8yf859sla6fs2l58y';

-- ============================================
-- 4. TEST VALIDATION FUNCTION
-- ============================================

SELECT 'Testing validation function with restored invitation:' as info;
SELECT 
    'aqe8yf859sla6fs2l58y' as invitation_code,
    'test@example.com' as email,
    validate_artist_invitation('aqe8yf859sla6fs2l58y', 'test@example.com') as is_valid;

-- ============================================
-- 5. FINAL STATUS
-- ============================================

SELECT 'Invitation restoration complete!' as final_status;
SELECT 'The invitation aqe8yf859sla6fs2l58y should now work for signup.' as next_steps;
