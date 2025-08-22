-- Migration: Consolidate rights holders into profiles table
-- This consolidates the separate rights_holders and rights_holder_profiles tables into the main profiles table

-- 1. Add rights holder fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS rights_holder_type TEXT CHECK (rights_holder_type IN ('record_label', 'publisher')),
ADD COLUMN IF NOT EXISTS legal_entity_name TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address_line_1 TEXT,
ADD COLUMN IF NOT EXISTS address_line_2 TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US',
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rights_authority_declaration_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rights_authority_declaration_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS contact_person_name TEXT,
ADD COLUMN IF NOT EXISTS contact_person_title TEXT,
ADD COLUMN IF NOT EXISTS contact_person_email TEXT,
ADD COLUMN IF NOT EXISTS contact_person_phone TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS genres_specialty TEXT[],
ADD COLUMN IF NOT EXISTS years_in_business INTEGER,
ADD COLUMN IF NOT EXISTS pro_affiliations TEXT[],
ADD COLUMN IF NOT EXISTS publishing_admin TEXT,
ADD COLUMN IF NOT EXISTS master_admin TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_email TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- 2. Update account_type constraint to include rights_holder
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_account_type_check 
CHECK (account_type IN ('client', 'producer', 'admin', 'admin,producer', 'rights_holder'));

-- 3. Move existing rights holder data to profiles table
INSERT INTO profiles (
    id, email, account_type, rights_holder_type, company_name, legal_entity_name, 
    business_structure, tax_id, website, phone, address_line_1, address_line_2, 
    city, state, postal_code, country, verification_status, verification_notes, 
    is_active, terms_accepted, terms_accepted_at, rights_authority_declaration_accepted, 
    rights_authority_declaration_accepted_at, contact_person_name, contact_person_title, 
    contact_person_email, contact_person_phone, logo_url, description, genres_specialty, 
    years_in_business, pro_affiliations, publishing_admin, master_admin, 
    emergency_contact_name, emergency_contact_email, emergency_contact_phone, 
    created_at, updated_at
)
SELECT 
    rh.id, rh.email, 'rights_holder' as account_type, rh.rights_holder_type, rh.company_name, rh.legal_entity_name,
    rh.business_structure, rh.tax_id, rh.website, rh.phone, rh.address_line_1, rh.address_line_2,
    rh.city, rh.state, rh.postal_code, rh.country, rh.verification_status, rh.verification_notes,
    rh.is_active, rh.terms_accepted, rh.terms_accepted_at, rh.rights_authority_declaration_accepted,
    rh.rights_authority_declaration_accepted_at, rhp.contact_person_name, rhp.contact_person_title,
    rhp.contact_person_email, rhp.contact_person_phone, rhp.logo_url, rhp.description, rhp.genres_specialty,
    rhp.years_in_business, rhp.pro_affiliations, rhp.publishing_admin, rhp.master_admin,
    rhp.emergency_contact_name, rhp.emergency_contact_email, rhp.emergency_contact_phone,
    rh.created_at, rh.updated_at
FROM rights_holders rh
LEFT JOIN rights_holder_profiles rhp ON rh.id = rhp.rights_holder_id
ON CONFLICT (id) DO UPDATE SET
    account_type = EXCLUDED.account_type,
    rights_holder_type = EXCLUDED.rights_holder_type,
    company_name = EXCLUDED.company_name,
    legal_entity_name = EXCLUDED.legal_entity_name,
    business_structure = EXCLUDED.business_structure,
    tax_id = EXCLUDED.tax_id,
    phone = EXCLUDED.phone,
    address_line_1 = EXCLUDED.address_line_1,
    address_line_2 = EXCLUDED.address_line_2,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    postal_code = EXCLUDED.postal_code,
    country = EXCLUDED.country,
    verification_status = EXCLUDED.verification_status,
    verification_notes = EXCLUDED.verification_notes,
    is_active = EXCLUDED.is_active,
    terms_accepted = EXCLUDED.terms_accepted,
    terms_accepted_at = EXCLUDED.terms_accepted_at,
    rights_authority_declaration_accepted = EXCLUDED.rights_authority_declaration_accepted,
    rights_authority_declaration_accepted_at = EXCLUDED.rights_authority_declaration_accepted_at,
    contact_person_name = EXCLUDED.contact_person_name,
    contact_person_title = EXCLUDED.contact_person_title,
    contact_person_email = EXCLUDED.contact_person_email,
    contact_person_phone = EXCLUDED.contact_person_phone,
    logo_url = EXCLUDED.logo_url,
    description = EXCLUDED.description,
    genres_specialty = EXCLUDED.genres_specialty,
    years_in_business = EXCLUDED.years_in_business,
    pro_affiliations = EXCLUDED.pro_affiliations,
    publishing_admin = EXCLUDED.publishing_admin,
    master_admin = EXCLUDED.master_admin,
    emergency_contact_name = EXCLUDED.emergency_contact_name,
    emergency_contact_email = EXCLUDED.emergency_contact_email,
    emergency_contact_phone = EXCLUDED.emergency_contact_phone,
    updated_at = NOW();

-- 4. Update master_recordings table to reference profiles instead of rights_holders
ALTER TABLE master_recordings 
DROP CONSTRAINT IF EXISTS master_recordings_rights_holder_id_fkey,
ADD CONSTRAINT master_recordings_rights_holder_id_fkey 
FOREIGN KEY (rights_holder_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 5. Update publishing_rights table to reference profiles instead of rights_holders
ALTER TABLE publishing_rights 
DROP CONSTRAINT IF EXISTS publishing_rights_rights_holder_id_fkey,
ADD CONSTRAINT publishing_rights_rights_holder_id_fkey 
FOREIGN KEY (rights_holder_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 6. Update music_rights table to reference profiles instead of rights_holders
ALTER TABLE music_rights 
DROP CONSTRAINT IF EXISTS music_rights_rights_holder_id_fkey,
ADD CONSTRAINT music_rights_rights_holder_id_fkey 
FOREIGN KEY (rights_holder_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 7. Drop the separate rights holder tables (after ensuring data is migrated)
DROP TABLE IF EXISTS rights_holder_profiles CASCADE;
DROP TABLE IF EXISTS rights_holders CASCADE;

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_rights_holder_type ON profiles(rights_holder_type);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
