-- Fix Existing Rights Holders System
-- This script fixes issues with existing rights holders system without recreating existing policies

-- ============================================
-- 1. CHECK CURRENT STATE
-- ============================================

-- Check if tables exist and have data
SELECT 'rights_holders table status' as check_type, 
       COUNT(*) as record_count 
FROM rights_holders;

SELECT 'rights_holder_profiles table status' as check_type, 
       COUNT(*) as record_count 
FROM rights_holder_profiles;

-- ============================================
-- 2. FIX RLS POLICIES (DROP AND RECREATE IF NEEDED)
-- ============================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Rights holders can view own data" ON rights_holders;
DROP POLICY IF EXISTS "Rights holders can insert own data" ON rights_holders;
DROP POLICY IF EXISTS "Rights holders can update own data" ON rights_holders;
DROP POLICY IF EXISTS "Rights holders can view own profile" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Rights holders can insert own profile" ON rights_holder_profiles;
DROP POLICY IF EXISTS "Rights holders can update own profile" ON rights_holder_profiles;

-- Recreate policies with proper permissions
CREATE POLICY "Rights holders can view own data" ON rights_holders
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Rights holders can insert own data" ON rights_holders
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Rights holders can update own data" ON rights_holders
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Rights holders can view own profile" ON rights_holder_profiles
    FOR SELECT USING (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can insert own profile" ON rights_holder_profiles
    FOR INSERT WITH CHECK (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can update own profile" ON rights_holder_profiles
    FOR UPDATE USING (auth.uid() = rights_holder_id);

-- ============================================
-- 3. ENSURE RLS IS ENABLED
-- ============================================

ALTER TABLE rights_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE MISSING INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_rights_holders_email ON rights_holders(email);
CREATE INDEX IF NOT EXISTS idx_rights_holders_type ON rights_holders(rights_holder_type);
CREATE INDEX IF NOT EXISTS idx_rights_holders_verification_status ON rights_holders(verification_status);
CREATE INDEX IF NOT EXISTS idx_rights_holder_profiles_rights_holder_id ON rights_holder_profiles(rights_holder_id);

-- ============================================
-- 5. CREATE/UPDATE TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_rights_holders_updated_at ON rights_holders;
DROP TRIGGER IF EXISTS update_rights_holder_profiles_updated_at ON rights_holder_profiles;

-- Create triggers for updated_at
CREATE TRIGGER update_rights_holders_updated_at 
    BEFORE UPDATE ON rights_holders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rights_holder_profiles_updated_at 
    BEFORE UPDATE ON rights_holder_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. VERIFICATION
-- ============================================

-- Verify RLS is enabled
SELECT 'RLS enabled on rights_holders' as status WHERE EXISTS (
    SELECT FROM pg_tables 
    WHERE tablename = 'rights_holders' 
    AND rowsecurity = true
);

SELECT 'RLS enabled on rights_holder_profiles' as status WHERE EXISTS (
    SELECT FROM pg_tables 
    WHERE tablename = 'rights_holder_profiles' 
    AND rowsecurity = true
);

-- Verify policies exist
SELECT 'Policies created for rights_holders' as status WHERE EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'rights_holders' 
    AND policyname = 'Rights holders can view own data'
);

SELECT 'Policies created for rights_holder_profiles' as status WHERE EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'rights_holder_profiles' 
    AND policyname = 'Rights holders can view own profile'
);

-- Test basic query
SELECT 'Test query successful' as status, COUNT(*) as total_rights_holders FROM rights_holders;
