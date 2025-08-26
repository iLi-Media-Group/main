-- Check the failing invitation code status
-- This will tell us exactly what's wrong with aqe8yf859sla6fs2l58y

SELECT 'Checking failing invitation code:' as info;
SELECT 
    invitation_code,
    email,
    artist_number,
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

-- If the invitation doesn't exist, show all invitations to see what happened
SELECT 'All artist invitations (if above is empty):' as info;
SELECT 
    invitation_code,
    email,
    artist_number,
    used,
    created_at,
    expires_at
FROM artist_invitations 
ORDER BY created_at DESC
LIMIT 10;
