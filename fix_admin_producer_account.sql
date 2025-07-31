-- Fix Admin/Producer Account Type
-- This script updates the main admin account to have dual role

-- First, let's see what account types exist
SELECT account_type, COUNT(*) FROM profiles GROUP BY account_type;

-- Update the main admin account to have dual role
-- Replace 'your-email@example.com' with your actual email
UPDATE profiles 
SET account_type = 'admin,producer'
WHERE email = 'knockriobeats@gmail.com';

-- Also update other admin accounts if needed
UPDATE profiles 
SET account_type = 'admin,producer'
WHERE email IN ('info@mybeatfi.io', 'derykbanks@yahoo.com');

-- Verify the changes
SELECT 
    email,
    account_type,
    created_at
FROM profiles 
WHERE account_type LIKE '%admin%'
ORDER BY created_at DESC;

-- Check if the constraint allows admin,producer
SELECT 
    'profiles with admin,producer' as description,
    COUNT(*) as count
FROM profiles 
WHERE account_type = 'admin,producer'; 