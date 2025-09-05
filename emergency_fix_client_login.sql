-- EMERGENCY FIX: Restore client login functionality
-- Drop the restrictive policies and create working ones

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view own profile only" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile by email" ON profiles;

-- Create a working policy that allows users to access their own profile
CREATE POLICY "Users can access own profile" ON profiles
    FOR ALL USING (
        auth.uid() = id OR 
        (auth.jwt() ->> 'email')::text = email
    );

-- Test if client login works now
SELECT 
    'EMERGENCY FIX TEST' as info,
    COUNT(*) as accessible_profiles,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ CLIENT LOGIN FIXED'
        WHEN COUNT(*) > 1 THEN '❌ INSECURE - Multiple profiles accessible'
        ELSE '❌ CLIENT LOGIN STILL BROKEN'
    END as login_status
FROM profiles;
