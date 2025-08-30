-- Create the missing rights_holders table
-- This is needed for the rights holder application system to work

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

-- Enable RLS
ALTER TABLE rights_holders ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Rights holders can view own data" ON rights_holders
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Rights holders can insert own data" ON rights_holders
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Rights holders can update own data" ON rights_holders
    FOR UPDATE USING (auth.uid() = id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rights_holders_email ON rights_holders(email);
CREATE INDEX IF NOT EXISTS idx_rights_holders_type ON rights_holders(rights_holder_type);
CREATE INDEX IF NOT EXISTS idx_rights_holders_verification_status ON rights_holders(verification_status);

-- Verify the table was created
SELECT 'rights_holders table created successfully' as status;
