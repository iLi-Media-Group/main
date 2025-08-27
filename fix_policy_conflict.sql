-- FIX POLICY CONFLICT: Drop existing policy before creating new one
-- This will fix the "policy already exists" error

-- Drop the existing admin policy first
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Now create the admin policy
CREATE POLICY "Admins can manage all profiles" ON profiles
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            'knockriobeats@gmail.com',
            'info@mybeatfi.io', 
            'derykbanks@yahoo.com',
            'knockriobeats2@gmail.com'
        )
    );

-- Test that authentication works properly now
SELECT 
    'AUTHENTICATION TEST' as info,
    COUNT(*) as accessible_profiles,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ AUTHENTICATION WORKING'
        WHEN COUNT(*) > 1 THEN '❌ INSECURE - Multiple profiles accessible'
        ELSE '❌ AUTHENTICATION BROKEN'
    END as auth_status
FROM profiles;
