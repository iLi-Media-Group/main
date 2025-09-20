-- FIX POLICY CONFLICT: Drop existing policies before creating new ones
-- This will fix the "policy already exists" error

-- Drop the existing policies first
DROP POLICY IF EXISTS "Users can view own profile only" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile only" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile only" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Now create the working policies
CREATE POLICY "Users can view own profile only" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile only" ON profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile only" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile only" ON profiles
    FOR DELETE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON profiles
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            'knockriobeats@gmail.com',
            'info@mybeatfi.io', 
            'derykbanks@yahoo.com',
            'knockriobeats2@gmail.com'
        )
    );

-- Test that client login works now
SELECT 
    'CLIENT LOGIN TEST' as info,
    COUNT(*) as accessible_profiles,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ CLIENT LOGIN FIXED'
        WHEN COUNT(*) > 1 THEN '❌ INSECURE - Multiple profiles accessible'
        ELSE '❌ CLIENT LOGIN STILL BROKEN'
    END as login_status
FROM profiles;
