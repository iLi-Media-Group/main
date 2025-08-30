-- Fix Dual Role Admin/Producer Setup
-- This ensures that you (knockriobeats@gmail.com) have both admin and producer access
-- while other admins only have admin access

-- First, let's see the current state
SELECT 'Current Account Types:' as info;
SELECT id, email, account_type 
FROM profiles 
WHERE email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com');

-- Update your account to have dual role (admin + producer)
UPDATE profiles 
SET account_type = 'admin,producer'
WHERE email = 'knockriobeats@gmail.com';

-- Update other admin accounts to be admin only
UPDATE profiles 
SET account_type = 'admin'
WHERE email IN ('info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com');

-- Verify the changes
SELECT 'Updated Account Types:' as info;
SELECT id, email, account_type 
FROM profiles 
WHERE email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com');

-- Show all users with admin access
SELECT 'All Admin Users:' as info;
SELECT id, email, account_type, created_at
FROM profiles 
WHERE account_type LIKE '%admin%'
ORDER BY created_at DESC; 