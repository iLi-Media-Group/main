-- Re-enable RLS with Proper Policies
-- Run this after confirming that disabling RLS fixes the 406 errors

-- 1. Drop all existing policies first
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON background_assets;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON background_assets;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON background_assets;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON background_assets;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON rights_holders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON rights_holders;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON rights_holders;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON rights_holders;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON rights_holder_profiles;

-- 2. Create simple, permissive policies for background_assets
CREATE POLICY "background_assets_select" ON background_assets
    FOR SELECT USING (true);

CREATE POLICY "background_assets_insert" ON background_assets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "background_assets_update" ON background_assets
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "background_assets_delete" ON background_assets
    FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Create policies for rights_holders
CREATE POLICY "rights_holders_select" ON rights_holders
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.account_type = 'admin'
            )
        )
    );

CREATE POLICY "rights_holders_insert" ON rights_holders
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.account_type = 'admin'
            )
        )
    );

CREATE POLICY "rights_holders_update" ON rights_holders
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.account_type = 'admin'
            )
        )
    );

CREATE POLICY "rights_holders_delete" ON rights_holders
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

-- 4. Create policies for rights_holder_profiles
CREATE POLICY "rights_holder_profiles_select" ON rights_holder_profiles
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            rights_holder_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.account_type = 'admin'
            )
        )
    );

CREATE POLICY "rights_holder_profiles_insert" ON rights_holder_profiles
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            rights_holder_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.account_type = 'admin'
            )
        )
    );

CREATE POLICY "rights_holder_profiles_update" ON rights_holder_profiles
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            rights_holder_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.account_type = 'admin'
            )
        )
    );

CREATE POLICY "rights_holder_profiles_delete" ON rights_holder_profiles
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

-- 5. Re-enable RLS
ALTER TABLE background_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('background_assets', 'rights_holders', 'rights_holder_profiles')
ORDER BY tablename, policyname;
