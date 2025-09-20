-- CHECK ARTIST ACCOUNTS: See if any artists have the wrong account_type
-- This will show us if artists are incorrectly set as rights_holders

-- Check all accounts that should be artists
SELECT 
    'ARTISTS WITH WRONG ACCOUNT TYPE' as info,
    id,
    email,
    account_type,
    first_name,
    last_name,
    created_at
FROM profiles 
WHERE email LIKE '%artist%' 
   OR email LIKE '%band%'
   OR first_name LIKE '%artist%'
   OR last_name LIKE '%artist%'
   OR account_type = 'artist_band'
ORDER BY created_at;

-- Check for any accounts that might be artists but are set as rights_holders
SELECT 
    'POTENTIAL ARTISTS SET AS RIGHTS HOLDERS' as info,
    id,
    email,
    account_type,
    first_name,
    last_name,
    created_at
FROM profiles 
WHERE account_type = 'rights_holder'
   AND (email LIKE '%artist%' 
        OR email LIKE '%band%'
        OR first_name LIKE '%artist%'
        OR last_name LIKE '%artist%')
ORDER BY created_at;
