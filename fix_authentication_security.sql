-- FIX AUTHENTICATION SECURITY: Ensure users can only access their own profiles
-- This will fix the cross-account access issue

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Admin access" ON profiles;
DROP POLICY IF EXISTS "Admin dashboard access" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admins to manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage their profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to delete their own profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to create their own profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile only" ON profiles;
DROP POLICY IF EXISTS "Admin users can view admin_user_details" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admins to view admin_user_details" ON profiles;
DROP POLICY IF EXISTS "Allow public read access to profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to view their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile only" ON profiles;
DROP POLICY IF EXISTS "Users can view their own sensitive info" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON profiles;

-- Create secure policies that only allow users to access their own profiles
-- Users can view their own profile only
CREATE POLICY "Users can view own profile only" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile only
CREATE POLICY "Users can update own profile only" ON profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Users can insert their own profile only
CREATE POLICY "Users can insert own profile only" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can delete their own profile only
CREATE POLICY "Users can delete own profile only" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- Admins can manage all profiles (for admin emails only)
CREATE POLICY "Admins can manage all profiles" ON profiles
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            'knockriobeats@gmail.com',
            'info@mybeatfi.io', 
            'derykbanks@yahoo.com',
            'knockriobeats2@gmail.com'
        )
    );

-- Test the security
SELECT 
    'SECURITY TEST' as test_type,
    COUNT(*) as accessible_profiles,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ SECURE - User can only see their own profile'
        WHEN COUNT(*) > 1 THEN '❌ INSECURE - User can see multiple profiles'
        ELSE '❌ NO ACCESS - User cannot see any profiles'
    END as security_status
FROM profiles;
