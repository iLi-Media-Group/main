-- Clean up duplicate RLS policies for discounts table

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow admin access to discounts" ON discounts;
DROP POLICY IF EXISTS "Allow read access to active discounts" ON discounts;
DROP POLICY IF EXISTS "Enable read access for all users" ON discounts;
DROP POLICY IF EXISTS "Enable read access for admins" ON discounts;
DROP POLICY IF EXISTS "Enable insert for admins" ON discounts;
DROP POLICY IF EXISTS "Enable update for admins" ON discounts;
DROP POLICY IF EXISTS "Enable delete for admins" ON discounts;

-- Create clean, non-duplicate policies

-- 1. Allow all authenticated users to read active discounts
CREATE POLICY "Enable read access for all users" ON discounts
    FOR SELECT
    USING (is_active = true);

-- 2. Allow admin users to read all discounts (including inactive ones)
CREATE POLICY "Enable read access for admins" ON discounts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.account_type = 'admin' 
                OR profiles.account_type = 'admin,producer'
                OR profiles.email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
            )
        )
    );

-- 3. Allow admin users to insert discounts
CREATE POLICY "Enable insert for admins" ON discounts
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.account_type = 'admin' 
                OR profiles.account_type = 'admin,producer'
                OR profiles.email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
            )
        )
    );

-- 4. Allow admin users to update discounts
CREATE POLICY "Enable update for admins" ON discounts
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.account_type = 'admin' 
                OR profiles.account_type = 'admin,producer'
                OR profiles.email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.account_type = 'admin' 
                OR profiles.account_type = 'admin,producer'
                OR profiles.email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
            )
        )
    );

-- 5. Allow admin users to delete discounts
CREATE POLICY "Enable delete for admins" ON discounts
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.account_type = 'admin' 
                OR profiles.account_type = 'admin,producer'
                OR profiles.email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com')
            )
        )
    );

-- Verify the policies
SELECT 'Cleaned up RLS policies for discounts table:' as info;
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Read access'
        WHEN cmd = 'INSERT' THEN 'Create access'
        WHEN cmd = 'UPDATE' THEN 'Update access'
        WHEN cmd = 'DELETE' THEN 'Delete access'
        ELSE cmd
    END as access_type
FROM pg_policies 
WHERE tablename = 'discounts'
ORDER BY cmd, policyname; 