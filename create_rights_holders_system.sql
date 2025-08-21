-- Rights Holders System Migration
-- This creates a comprehensive system for record labels and publishers
-- with rights verification, split sheets, and legal protection

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
-- 2. MASTER RECORDINGS SYSTEM
-- ============================================

-- Master recordings table
CREATE TABLE IF NOT EXISTS master_recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rights_holder_id UUID REFERENCES rights_holders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT,
    isrc TEXT UNIQUE, -- International Standard Recording Code
    upc TEXT, -- Universal Product Code
    release_date DATE,
    genre TEXT,
    sub_genre TEXT,
    bpm INTEGER,
    key TEXT,
    duration INTEGER, -- in seconds
    audio_url TEXT,
    image_url TEXT,
    stems_url TEXT,
    trackouts_url TEXT,
    split_sheet_url TEXT,
    rights_verification_status TEXT DEFAULT 'pending' CHECK (rights_verification_status IN ('pending', 'verified', 'rejected', 'disputed')),
    admin_review_status TEXT DEFAULT 'pending' CHECK (admin_review_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    admin_review_notes TEXT,
    is_licensed BOOLEAN DEFAULT false,
    licensing_tier TEXT DEFAULT 'unverified' CHECK (licensing_tier IN ('unverified', 'verified', 'premium')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. PUBLISHING RIGHTS SYSTEM
-- ============================================

-- Publishing rights table
CREATE TABLE IF NOT EXISTS publishing_rights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    master_recording_id UUID REFERENCES master_recordings(id) ON DELETE CASCADE,
    rights_holder_id UUID REFERENCES rights_holders(id) ON DELETE CASCADE,
    song_title TEXT NOT NULL,
    iswc TEXT, -- International Standard Musical Work Code
    copyright_year INTEGER,
    copyright_owner TEXT,
    pro_affiliation TEXT, -- ASCAP, BMI, SESAC, etc.
    publishing_admin TEXT,
    mechanical_rights_controlled BOOLEAN DEFAULT false,
    sync_rights_controlled BOOLEAN DEFAULT false,
    performance_rights_controlled BOOLEAN DEFAULT false,
    print_rights_controlled BOOLEAN DEFAULT false,
    rights_verification_status TEXT DEFAULT 'pending' CHECK (rights_verification_status IN ('pending', 'verified', 'rejected', 'disputed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. SPLIT SHEETS SYSTEM
-- ============================================

-- Split sheets table
CREATE TABLE IF NOT EXISTS split_sheets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    master_recording_id UUID REFERENCES master_recordings(id) ON DELETE CASCADE,
    split_sheet_type TEXT NOT NULL CHECK (split_sheet_type IN ('master', 'publishing', 'combined')),
    total_percentage DECIMAL(5,2) NOT NULL CHECK (total_percentage = 100.00),
    is_signed BOOLEAN DEFAULT false,
    signed_at TIMESTAMP WITH TIME ZONE,
    signature_method TEXT CHECK (signature_method IN ('e_sign', 'pdf_upload', 'manual')),
    split_sheet_url TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'disputed')),
    admin_review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual splits within a split sheet
CREATE TABLE IF NOT EXISTS split_sheet_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    split_sheet_id UUID REFERENCES split_sheets(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    participant_role TEXT NOT NULL CHECK (participant_role IN ('writer', 'producer', 'publisher', 'performer', 'arranger', 'mixer', 'mastering_engineer')),
    percentage DECIMAL(5,2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
    pro_affiliation TEXT, -- ASCAP, BMI, SESAC, etc.
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    tax_id TEXT,
    is_signed BOOLEAN DEFAULT false,
    signed_at TIMESTAMP WITH TIME ZONE,
    signature_method TEXT CHECK (signature_method IN ('e_sign', 'pdf_upload', 'manual')),
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. RIGHTS AGREEMENTS SYSTEM
-- ============================================

-- Rights agreements and terms acceptance
CREATE TABLE IF NOT EXISTS rights_agreements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rights_holder_id UUID REFERENCES rights_holders(id) ON DELETE CASCADE,
    agreement_type TEXT NOT NULL CHECK (agreement_type IN ('terms_of_service', 'upload_agreement', 'split_sheet_agreement', 'licensing_agreement')),
    agreement_version TEXT NOT NULL,
    agreement_content TEXT NOT NULL,
    is_accepted BOOLEAN DEFAULT false,
    accepted_at TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    user_agent TEXT,
    signature_method TEXT CHECK (signature_method IN ('e_sign', 'click_accept', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. RIGHTS VERIFICATION SYSTEM
-- ============================================

-- Rights verification tracking
CREATE TABLE IF NOT EXISTS rights_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    master_recording_id UUID REFERENCES master_recordings(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('master_rights', 'publishing_rights', 'split_sheet', 'admin_review')),
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'in_progress', 'verified', 'rejected', 'needs_additional_info')),
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_notes TEXT,
    required_actions TEXT[],
    next_review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. CO-SIGNERS SYSTEM
-- ============================================

-- Co-signers for split sheets
CREATE TABLE IF NOT EXISTS co_signers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    split_sheet_id UUID REFERENCES split_sheets(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    invitation_token TEXT UNIQUE NOT NULL,
    invitation_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invitation_expires_at TIMESTAMP WITH TIME ZONE,
    is_signed BOOLEAN DEFAULT false,
    signed_at TIMESTAMP WITH TIME ZONE,
    signature_method TEXT CHECK (signature_method IN ('e_sign', 'pdf_upload', 'manual')),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. LICENSING TRACKING
-- ============================================

-- Track licensing activity
CREATE TABLE IF NOT EXISTS rights_licenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    master_recording_id UUID REFERENCES master_recordings(id) ON DELETE CASCADE,
    licensee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    license_type TEXT NOT NULL CHECK (license_type IN ('sync', 'master_use', 'mechanical', 'performance')),
    license_terms TEXT,
    license_fee DECIMAL(10,2),
    license_start_date DATE,
    license_end_date DATE,
    license_status TEXT DEFAULT 'active' CHECK (license_status IN ('active', 'expired', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE rights_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishing_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_sheet_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_licenses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 10. RLS POLICIES
-- ============================================

-- Rights holders can view and update their own data
CREATE POLICY "Rights holders can view own data" ON rights_holders
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Rights holders can update own data" ON rights_holders
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Rights holders can insert own data" ON rights_holders
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Rights holder profiles
CREATE POLICY "Rights holders can view own profiles" ON rights_holder_profiles
    FOR SELECT USING (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can update own profiles" ON rights_holder_profiles
    FOR UPDATE USING (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can insert own profiles" ON rights_holder_profiles
    FOR INSERT WITH CHECK (auth.uid() = rights_holder_id);

-- Master recordings
CREATE POLICY "Rights holders can view own recordings" ON master_recordings
    FOR SELECT USING (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can update own recordings" ON master_recordings
    FOR UPDATE USING (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can insert own recordings" ON master_recordings
    FOR INSERT WITH CHECK (auth.uid() = rights_holder_id);

-- Public can view approved recordings
CREATE POLICY "Public can view approved recordings" ON master_recordings
    FOR SELECT USING (admin_review_status = 'approved' AND rights_verification_status = 'verified');

-- Publishing rights
CREATE POLICY "Rights holders can view own publishing rights" ON publishing_rights
    FOR SELECT USING (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can update own publishing rights" ON publishing_rights
    FOR UPDATE USING (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can insert own publishing rights" ON publishing_rights
    FOR INSERT WITH CHECK (auth.uid() = rights_holder_id);

-- Split sheets
CREATE POLICY "Rights holders can view own split sheets" ON split_sheets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM master_recordings 
            WHERE master_recordings.id = split_sheets.master_recording_id 
            AND master_recordings.rights_holder_id = auth.uid()
        )
    );

CREATE POLICY "Rights holders can update own split sheets" ON split_sheets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM master_recordings 
            WHERE master_recordings.id = split_sheets.master_recording_id 
            AND master_recordings.rights_holder_id = auth.uid()
        )
    );

CREATE POLICY "Rights holders can insert own split sheets" ON split_sheets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM master_recordings 
            WHERE master_recordings.id = split_sheets.master_recording_id 
            AND master_recordings.rights_holder_id = auth.uid()
        )
    );

-- Split sheet participants
CREATE POLICY "Rights holders can view own split participants" ON split_sheet_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM split_sheets 
            JOIN master_recordings ON master_recordings.id = split_sheets.master_recording_id
            WHERE split_sheets.id = split_sheet_participants.split_sheet_id 
            AND master_recordings.rights_holder_id = auth.uid()
        )
    );

CREATE POLICY "Rights holders can update own split participants" ON split_sheet_participants
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM split_sheets 
            JOIN master_recordings ON master_recordings.id = split_sheets.master_recording_id
            WHERE split_sheets.id = split_sheet_participants.split_sheet_id 
            AND master_recordings.rights_holder_id = auth.uid()
        )
    );

CREATE POLICY "Rights holders can insert own split participants" ON split_sheet_participants
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM split_sheets 
            JOIN master_recordings ON master_recordings.id = split_sheets.master_recording_id
            WHERE split_sheets.id = split_sheet_participants.split_sheet_id 
            AND master_recordings.rights_holder_id = auth.uid()
        )
    );

-- Rights agreements
CREATE POLICY "Rights holders can view own agreements" ON rights_agreements
    FOR SELECT USING (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can update own agreements" ON rights_agreements
    FOR UPDATE USING (auth.uid() = rights_holder_id);

CREATE POLICY "Rights holders can insert own agreements" ON rights_agreements
    FOR INSERT WITH CHECK (auth.uid() = rights_holder_id);

-- Rights verifications (admin only for now)
CREATE POLICY "Admins can view all verifications" ON rights_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type IN ('admin', 'admin,producer')
        )
    );

CREATE POLICY "Admins can update all verifications" ON rights_verifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type IN ('admin', 'admin,producer')
        )
    );

CREATE POLICY "Admins can insert verifications" ON rights_verifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type IN ('admin', 'admin,producer')
        )
    );

-- Co-signers (rights holders can view their own)
CREATE POLICY "Rights holders can view own co-signers" ON co_signers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM split_sheets 
            JOIN master_recordings ON master_recordings.id = split_sheets.master_recording_id
            WHERE split_sheets.id = co_signers.split_sheet_id 
            AND master_recordings.rights_holder_id = auth.uid()
        )
    );

CREATE POLICY "Rights holders can update own co-signers" ON co_signers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM split_sheets 
            JOIN master_recordings ON master_recordings.id = split_sheets.master_recording_id
            WHERE split_sheets.id = co_signers.split_sheet_id 
            AND master_recordings.rights_holder_id = auth.uid()
        )
    );

CREATE POLICY "Rights holders can insert own co-signers" ON co_signers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM split_sheets 
            JOIN master_recordings ON master_recordings.id = split_sheets.master_recording_id
            WHERE split_sheets.id = co_signers.split_sheet_id 
            AND master_recordings.rights_holder_id = auth.uid()
        )
    );

-- Rights licenses
CREATE POLICY "Rights holders can view own licenses" ON rights_licenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM master_recordings 
            WHERE master_recordings.id = rights_licenses.master_recording_id 
            AND master_recordings.rights_holder_id = auth.uid()
        )
    );

CREATE POLICY "Rights holders can update own licenses" ON rights_licenses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM master_recordings 
            WHERE master_recordings.id = rights_licenses.master_recording_id 
            AND master_recordings.rights_holder_id = auth.uid()
        )
    );

CREATE POLICY "Rights holders can insert own licenses" ON rights_licenses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM master_recordings 
            WHERE master_recordings.id = rights_licenses.master_recording_id 
            AND master_recordings.rights_holder_id = auth.uid()
        )
    );

-- ============================================
-- 11. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_rights_holders_type ON rights_holders(rights_holder_type);
CREATE INDEX IF NOT EXISTS idx_rights_holders_verification ON rights_holders(verification_status);
CREATE INDEX IF NOT EXISTS idx_master_recordings_holder ON master_recordings(rights_holder_id);
CREATE INDEX IF NOT EXISTS idx_master_recordings_status ON master_recordings(admin_review_status, rights_verification_status);
CREATE INDEX IF NOT EXISTS idx_master_recordings_isrc ON master_recordings(isrc);
CREATE INDEX IF NOT EXISTS idx_publishing_rights_master ON publishing_rights(master_recording_id);
CREATE INDEX IF NOT EXISTS idx_publishing_rights_iswc ON publishing_rights(iswc);
CREATE INDEX IF NOT EXISTS idx_split_sheets_master ON split_sheets(master_recording_id);
CREATE INDEX IF NOT EXISTS idx_split_sheets_type ON split_sheets(split_sheet_type);
CREATE INDEX IF NOT EXISTS idx_split_participants_sheet ON split_sheet_participants(split_sheet_id);
CREATE INDEX IF NOT EXISTS idx_co_signers_token ON co_signers(invitation_token);
CREATE INDEX IF NOT EXISTS idx_co_signers_email ON co_signers(email);
CREATE INDEX IF NOT EXISTS idx_rights_verifications_master ON rights_verifications(master_recording_id);
CREATE INDEX IF NOT EXISTS idx_rights_verifications_type ON rights_verifications(verification_type);

-- ============================================
-- 12. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE rights_holders IS 'Main table for record labels and publishers';
COMMENT ON TABLE rights_holder_profiles IS 'Extended profile information for rights holders';
COMMENT ON TABLE master_recordings IS 'Master recordings uploaded by rights holders';
COMMENT ON TABLE publishing_rights IS 'Publishing rights information for compositions';
COMMENT ON TABLE split_sheets IS 'Ownership and royalty split documentation';
COMMENT ON TABLE split_sheet_participants IS 'Individual participants in split sheets';
COMMENT ON TABLE rights_agreements IS 'Legal agreements and terms acceptance';
COMMENT ON TABLE rights_verifications IS 'Rights verification tracking and status';
COMMENT ON TABLE co_signers IS 'Co-signers for split sheet agreements';
COMMENT ON TABLE rights_licenses IS 'Licensing activity tracking';

COMMENT ON COLUMN rights_holders.rights_holder_type IS 'Type of rights holder: record_label or publisher';
COMMENT ON COLUMN rights_holders.verification_status IS 'Verification status: pending, verified, rejected, suspended';
COMMENT ON COLUMN master_recordings.isrc IS 'International Standard Recording Code';
COMMENT ON COLUMN master_recordings.licensing_tier IS 'Licensing tier: unverified, verified, premium';
COMMENT ON COLUMN publishing_rights.iswc IS 'International Standard Musical Work Code';
COMMENT ON COLUMN split_sheets.total_percentage IS 'Must equal 100.00 for valid split sheet';
COMMENT ON COLUMN split_sheet_participants.percentage IS 'Individual percentage share (0-100)';
