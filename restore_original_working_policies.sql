-- RESTORE ORIGINAL WORKING POLICIES: Fix the client login I broke
-- Remove all the policies I created and restore the original working ones

-- Drop all the policies I created that broke client login
DROP POLICY IF EXISTS "Allow users to view their own profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to create their own profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to delete their own profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Restore the original working policies that were there before
-- These are the policies that were working for months

-- Users can view their own profiles
CREATE POLICY "Users can view own profile only" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profiles
CREATE POLICY "Users can update own profile only" ON profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Users can insert their own profiles
CREATE POLICY "Users can insert own profile only" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can delete their own profiles
CREATE POLICY "Users can delete own profile only" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- Admins can manage all profiles
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
