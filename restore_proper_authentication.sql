-- RESTORE PROPER AUTHENTICATION: Fix the authentication system properly
-- Remove all the broken policies and restore working ones

-- Drop all the problematic policies I created
DROP POLICY IF EXISTS "Users can view own profile only" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile only" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile only" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile by email" ON profiles;
DROP POLICY IF EXISTS "Users can access own profile" ON profiles;

-- Restore the original working policies that were there before
-- Users can view their own profiles
CREATE POLICY "Allow users to view their own profiles" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profiles
CREATE POLICY "Allow users to update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Users can insert their own profiles
CREATE POLICY "Allow users to create their own profiles" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can delete their own profiles
CREATE POLICY "Allow users to delete their own profiles" ON profiles
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
