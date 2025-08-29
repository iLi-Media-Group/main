-- Fix All Media Types and Related Errors
-- This addresses the 403 error on media_types and 406 errors on other endpoints

-- ============================================
-- 1. FIX MEDIA TYPES PERMISSIONS (403 Error)
-- ============================================

-- Drop the restrictive admin-only policy
DROP POLICY IF EXISTS "Allow admin access to media types" ON media_types;

-- Create a new policy that allows both producers and admins to manage media types
CREATE POLICY "Allow producers and admins to manage media types" ON media_types
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE account_type IN ('admin', 'producer')
        )
    );

-- Ensure the read policy is in place for all authenticated users
DROP POLICY IF EXISTS "Allow read access to media types" ON media_types;
CREATE POLICY "Allow read access to media types" ON media_types
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- 2. CREATE MISSING TABLES (406 Errors)
-- ============================================

-- Create rights_holder_balances table if it doesn't exist
CREATE TABLE IF NOT EXISTS rights_holder_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rights_holder_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    pending_balance DECIMAL(10,2) DEFAULT 0.00,
    available_balance DECIMAL(10,2) DEFAULT 0.00,
    lifetime_earnings DECIMAL(10,2) DEFAULT 0.00,
    total_payouts DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to background_assets table if they don't exist
ALTER TABLE background_assets ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE background_assets ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE background_assets ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE background_assets ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE background_assets ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE background_assets ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE rights_holder_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_assets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Rights holder balances policies
DROP POLICY IF EXISTS "Users can view own balances" ON rights_holder_balances;
DROP POLICY IF EXISTS "Users can manage own balances" ON rights_holder_balances;

CREATE POLICY "Users can view own balances" ON rights_holder_balances
    FOR SELECT USING (auth.uid() = rights_holder_id);

CREATE POLICY "Users can manage own balances" ON rights_holder_balances
    FOR ALL USING (auth.uid() = rights_holder_id);

-- Background assets policies (fix 406 errors)
DROP POLICY IF EXISTS "Enable read access for all users" ON background_assets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON background_assets;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON background_assets;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON background_assets;

CREATE POLICY "Enable read access for all users" ON background_assets
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON background_assets
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users only" ON background_assets
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users only" ON background_assets
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================

GRANT ALL ON rights_holder_balances TO authenticated;
GRANT ALL ON background_assets TO authenticated;

-- ============================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_rights_holder_balances_rights_holder_id ON rights_holder_balances(rights_holder_id);
CREATE INDEX IF NOT EXISTS idx_background_assets_page ON background_assets(page);
CREATE INDEX IF NOT EXISTS idx_background_assets_isactive ON background_assets("isActive");

-- ============================================
-- 7. INSERT DEFAULT BACKGROUND ASSETS
-- ============================================

-- Insert default background asset for producer login if none exists
-- Using the correct column structure: name, url, type, page, "isActive", file_size
INSERT INTO background_assets (name, url, type, page, "isActive", file_size)
SELECT 'Producer Login Background', '/images/default-background.jpg', 'image', 'producer-login', true, 0
WHERE NOT EXISTS (
    SELECT 1 FROM background_assets 
    WHERE page = 'producer-login' AND "isActive" = true
);

-- ============================================
-- 8. VERIFY SETUP
-- ============================================

-- Check if tables exist and have data
SELECT 'rights_holder_balances' as table_name, COUNT(*) as count FROM rights_holder_balances
UNION ALL
SELECT 'background_assets' as table_name, COUNT(*) as count FROM background_assets
UNION ALL
SELECT 'media_types' as table_name, COUNT(*) as count FROM media_types;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('media_types', 'rights_holder_balances', 'background_assets')
ORDER BY tablename, policyname;
