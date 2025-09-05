-- Deploy Rights Holders System
-- This script ensures all tables, RLS policies, and functions are properly created

-- ============================================
-- 1. RIGHTS HOLDERS CORE TABLES
-- ============================================

-- Main rights holders table (record labels and publishers)
CREATE TABLE IF NOT EXISTS rights_holders (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    rights_holder_type TEXT NOT NULL CHECK (rights_holder_type IN ('record_label', 'publisher')),
    company_name TEXT NOT NULL,
    legal_entity_name TEXT,
    business_structure TEXT CHECK (business_structure IN ('sole_proprietorship', 'llc', 'corporation', 'partnership', 'other')),
    tax_id TEXT,
    website TEXT,
    phone TEXT,
    address_line_1 TEXT,
    address_line_2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'US',
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
    verification_notes TEXT,
    is_active BOOLEAN DEFAULT true,
    terms_accepted BOOLEAN DEFAULT false,
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    rights_authority_declaration_accepted BOOLEAN DEFAULT false,
    rights_authority_declaration_accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extended profile information for rights holders
CREATE TABLE IF NOT EXISTS rights_holder_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rights_holder_id UUID REFERENCES rights_holders(id) ON DELETE CASCADE,
    contact_person_name TEXT,
    contact_person_title TEXT,
    contact_person_email TEXT,
    contact_person_phone TEXT,
    logo_url TEXT,
    description TEXT,
    genres_specialty TEXT[],
    years_in_business INTEGER,
    pro_affiliations TEXT[], -- ASCAP, BMI, SESAC, etc.
    publishing_admin TEXT, -- Publishing administrator if applicable
    master_admin TEXT, -- Master rights administrator if applicable
    emergency_contact_name TEXT,
    emergency_contact_email TEXT,
    emergency_contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on rights_holders table
ALTER TABLE rights_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE RLS POLICIES
-- ============================================

-- Rights holders can view their own data
CREATE POLICY "Rights holders can view own data" ON rights_holders
    FOR SELECT USING (auth.uid() = id);

-- Rights holders can insert their own data
CREATE POLICY "Rights holders can insert own data" ON rights_holders
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Rights holders can update their own data
CREATE POLICY "Rights holders can update own data" ON rights_holders
    FOR UPDATE USING (auth.uid() = id);

-- Rights holders can view their own profile
CREATE POLICY "Rights holders can view own profile" ON rights_holder_profiles
    FOR SELECT USING (auth.uid() = rights_holder_id);

-- Rights holders can insert their own profile
CREATE POLICY "Rights holders can insert own profile" ON rights_holder_profiles
    FOR INSERT WITH CHECK (auth.uid() = rights_holder_id);

-- Rights holders can update their own profile
CREATE POLICY "Rights holders can update own profile" ON rights_holder_profiles
    FOR UPDATE USING (auth.uid() = rights_holder_id);

-- ============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rights_holders_email ON rights_holders(email);
CREATE INDEX IF NOT EXISTS idx_rights_holders_type ON rights_holders(rights_holder_type);
CREATE INDEX IF NOT EXISTS idx_rights_holders_verification_status ON rights_holders(verification_status);
CREATE INDEX IF NOT EXISTS idx_rights_holder_profiles_rights_holder_id ON rights_holder_profiles(rights_holder_id);

-- ============================================
-- 5. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- Verify tables exist
SELECT 'rights_holders table exists' as status WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'rights_holders'
);

SELECT 'rights_holder_profiles table exists' as status WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'rights_holder_profiles'
);

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
