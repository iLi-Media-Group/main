-- Check current account type for knockriobeats@gmail.com
SELECT 
    id, 
    email, 
    account_type,
    created_at
FROM profiles 
WHERE email = 'knockriobeats@gmail.com';
