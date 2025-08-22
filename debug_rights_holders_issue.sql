-- Debug script for rights_holders 406 error
-- This will help us understand why the query is failing

-- 1. Check if the user ID exists in the rights_holders table
SELECT * FROM rights_holders WHERE id = '83e21f94-aced-452a-bafb-6eb9629e3b18';

-- 2. Check if the user exists in the auth.users table
SELECT * FROM auth.users WHERE id = '83e21f94-aced-452a-bafb-6eb9629e3b18';

-- 3. Check if the user exists in the profiles table
SELECT * FROM profiles WHERE id = '83e21f94-aced-452a-bafb-6eb9629e3b18';

-- 4. Check the structure of the rights_holders table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rights_holders' 
ORDER BY ordinal_position;

-- 5. Check if there are any rights_holders records at all
SELECT COUNT(*) as total_rights_holders FROM rights_holders;

-- 6. Check a few sample records
SELECT id, created_at FROM rights_holders LIMIT 5;

-- 7. Check if the table has any constraints that might be causing issues
SELECT 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'rights_holders';

-- 8. Check if there are any triggers on the rights_holders table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'rights_holders';
