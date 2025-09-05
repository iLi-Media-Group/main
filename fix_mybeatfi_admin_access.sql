-- Fix mybeatfi.io admin access
-- This ensures that all admin users on the main site have access to all features

-- First, let's see what the current account types are for admin users
SELECT 'Current Admin Account Types:' as info;
SELECT id, email, account_type 
FROM profiles 
WHERE email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com');

-- Update admin users to have 'admin' account_type
UPDATE profiles 
SET account_type = 'admin'
WHERE email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com');

-- Also update any other users who should be admins (you can add more emails here)
-- UPDATE profiles SET account_type = 'admin' WHERE email IN ('your-email@example.com');

-- Verify the update
SELECT 'Updated Admin Account Types:' as info;
SELECT id, email, account_type 
FROM profiles 
WHERE email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com');

-- Show all admin users
SELECT 'All Admin Users:' as info;
SELECT id, email, account_type, created_at
FROM profiles 
WHERE account_type = 'admin'
ORDER BY created_at DESC; 