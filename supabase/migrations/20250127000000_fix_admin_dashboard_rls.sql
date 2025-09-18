-- Fix RLS policies for admin dashboard tables (causing 406 errors)

-- 1. Fix background_assets table RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON background_assets;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON background_assets;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON background_assets;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON background_assets;

-- Create new policies that allow admin access
CREATE POLICY "Enable read access for authenticated users" ON background_assets
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            -- Allow access for admins
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.account_type = 'admin'
            )
            OR
            -- Allow public read access for active assets
            "isActive" = true
        )
    );

CREATE POLICY "Enable insert for authenticated users" ON background_assets
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            -- Allow insert for admins
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.account_type = 'admin'
            )
        )
    );

CREATE POLICY "Enable update for authenticated users" ON background_assets
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            -- Allow update for admins
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.account_type = 'admin'
            )
        )
    );

CREATE POLICY "Enable delete for authenticated users" ON background_assets
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            -- Allow delete for admins
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.account_type = 'admin'
            )
        )
    );

-- 2. Fix rights_holders table RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON rights_holders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON rights_holders;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON rights_holders;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON rights_holders;

-- Create new policies that allow admin access
CREATE POLICY "Enable read access for authenticated users" ON rights_holders
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            -- Allow access for admins
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.account_type = 'admin'
            )
            OR
            -- Allow users to read their own rights holder data
            id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for authenticated users" ON rights_holders
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            -- Allow insert for admins
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.account_type = 'admin'
            )
            OR
            -- Allow users to insert their own rights holder data
            id = auth.uid()
        )
    );

CREATE POLICY "Enable update for authenticated users" ON rights_holders
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            -- Allow update for admins
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.account_type = 'admin'
            )
            OR
            -- Allow users to update their own rights holder data
            id = auth.uid()
        )
    );

CREATE POLICY "Enable delete for authenticated users" ON rights_holders
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            -- Allow delete for admins
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.account_type = 'admin'
            )
        )
    );

-- 3. Fix rights_holder_profiles table RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON rights_holder_profiles;

-- Create new policies that allow admin access
CREATE POLICY "Enable read access for authenticated users" ON rights_holder_profiles
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            -- Allow access for admins
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.account_type = 'admin'
            )
            OR
            -- Allow users to read their own rights holder profile data
            rights_holder_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for authenticated users" ON rights_holder_profiles
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            -- Allow insert for admins
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.account_type = 'admin'
            )
            OR
            -- Allow users to insert their own rights holder profile data
            rights_holder_id = auth.uid()
        )
    );

CREATE POLICY "Enable update for authenticated users" ON rights_holder_profiles
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            -- Allow update for admins
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.account_type = 'admin'
            )
            OR
            -- Allow users to update their own rights holder profile data
            rights_holder_id = auth.uid()
        )
    );

CREATE POLICY "Enable delete for authenticated users" ON rights_holder_profiles
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            -- Allow delete for admins
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.account_type = 'admin'
            )
        )
    );

-- 4. Ensure RLS is enabled on these tables
ALTER TABLE background_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Grant necessary permissions
GRANT ALL ON background_assets TO authenticated;
GRANT ALL ON rights_holders TO authenticated;
GRANT ALL ON rights_holder_profiles TO authenticated;
