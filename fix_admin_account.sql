-- Fix admin account types for main admin users
-- This ensures that admin users have the correct account_type to access all features

-- First, let's see what the current account types are for admin users
SELECT 'Current Admin Account Types:' as info;
SELECT id, email, account_type 
FROM profiles 
WHERE email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com');

-- Update admin users to have 'admin' account_type
UPDATE profiles 
SET account_type = 'admin'
WHERE email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com');

-- Verify the update
SELECT 'Updated Admin Account Types:' as info;
SELECT id, email, account_type 
FROM profiles 
WHERE email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com'); 