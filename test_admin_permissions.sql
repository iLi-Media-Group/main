-- Test current user's admin permissions

-- Check current user
SELECT 'Current user info:' as info;
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email;

-- Check if current user has a profile
SELECT 'Current user profile:' as info;
SELECT 
    id,
    email,
    account_type,
    created_at,
    updated_at
FROM profiles 
WHERE id = auth.uid();

-- Test admin access conditions
SELECT 'Testing admin access conditions:' as info;
SELECT 
    'Is admin account_type' as condition,
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.account_type = 'admin'
    ) as is_admin;

SELECT 
    'Is admin,producer account_type' as condition,
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.account_type = 'admin,producer'
    ) as is_admin_producer;

SELECT 
    'Is specific admin email' as condition,
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
    ) as is_specific_admin;

-- Test if user can read discounts
SELECT 'Testing discount access:' as info;
SELECT COUNT(*) as active_discounts FROM discounts WHERE is_active = true;

-- Test if user can insert discounts (this will fail if not admin, which is expected)
SELECT 'Testing insert permission (this may fail if not admin):' as info;
-- We'll just check the policy, not actually insert
SELECT 
    'Can insert discounts' as permission,
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (
            profiles.account_type = 'admin' 
            OR profiles.account_type = 'admin,producer'
            OR profiles.email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
        )
    ) as can_insert; 