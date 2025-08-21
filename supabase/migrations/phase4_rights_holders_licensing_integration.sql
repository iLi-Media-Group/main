-- Phase 4: Rights Holders Licensing Integration
-- This migration integrates the existing licensing system with the new Rights Holders system

-- ============================================
-- 1. RIGHTS HOLDER LICENSING TABLES
-- ============================================

-- Rights holder licenses (replaces producer licenses for rights holder content)
CREATE TABLE IF NOT EXISTS rights_holder_licenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    master_recording_id UUID REFERENCES master_recordings(id) ON DELETE CASCADE,
    rights_holder_id UUID REFERENCES rights_holders(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    license_type TEXT NOT NULL CHECK (license_type IN ('single_track', 'membership_license', 'sync_proposal', 'custom_sync_request', 'exclusive_license')),
    license_status TEXT NOT NULL DEFAULT 'active' CHECK (license_status IN ('active', 'expired', 'cancelled', 'pending')),
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'stripe',
    transaction_id TEXT,
    stripe_payment_intent_id TEXT,
    licensee_info JSONB,
    license_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    license_end_date TIMESTAMP WITH TIME ZONE,
    territory TEXT DEFAULT 'worldwide',
    usage_restrictions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rights holder revenue tracking
CREATE TABLE IF NOT EXISTS rights_holder_revenue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rights_holder_id UUID REFERENCES rights_holders(id) ON DELETE CASCADE,
    license_id UUID REFERENCES rights_holder_licenses(id) ON DELETE CASCADE,
    revenue_type TEXT NOT NULL CHECK (revenue_type IN ('license_fee', 'sync_fee', 'membership_revenue', 'royalty_payment')),
    amount DECIMAL(10,2) NOT NULL,
    mybeatfi_commission DECIMAL(10,2) DEFAULT 0.00,
    rights_holder_amount DECIMAL(10,2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    stripe_payout_id TEXT,
    payout_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rights holder balances (similar to producer_balances)
CREATE TABLE IF NOT EXISTS rights_holder_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rights_holder_id UUID REFERENCES rights_holders(id) ON DELETE CASCADE UNIQUE,
    pending_balance DECIMAL(10,2) DEFAULT 0.00,
    available_balance DECIMAL(10,2) DEFAULT 0.00,
    lifetime_earnings DECIMAL(10,2) DEFAULT 0.00,
    total_payouts DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rights holder transactions (similar to producer_transactions)
CREATE TABLE IF NOT EXISTS rights_holder_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rights_holder_id UUID REFERENCES rights_holders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('license_sale', 'sync_fee', 'membership_revenue', 'payout', 'refund')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    description TEXT,
    recording_title TEXT,
    reference_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. ROYALTY DISTRIBUTION TRACKING
-- ============================================

-- Royalty distribution tracking (what rights holders should pay to contributors)
CREATE TABLE IF NOT EXISTS royalty_distributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_id UUID REFERENCES rights_holder_licenses(id) ON DELETE CASCADE,
    master_recording_id UUID REFERENCES master_recordings(id) ON DELETE CASCADE,
    rights_holder_id UUID REFERENCES rights_holders(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES split_sheet_participants(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    participant_role TEXT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    amount_owed DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue')),
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    payment_reference TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. LICENSE AGREEMENT TEMPLATES
-- ============================================

-- License agreement templates for rights holders
CREATE TABLE IF NOT EXISTS rights_holder_license_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK (template_type IN ('single_track', 'sync_license', 'exclusive_license', 'membership_license')),
    template_content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- License agreements generated for specific licenses
CREATE TABLE IF NOT EXISTS rights_holder_license_agreements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_id UUID REFERENCES rights_holder_licenses(id) ON DELETE CASCADE,
    template_id UUID REFERENCES rights_holder_license_templates(id) ON DELETE CASCADE,
    agreement_content TEXT NOT NULL,
    agreement_pdf_url TEXT,
    is_signed BOOLEAN DEFAULT false,
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- E-signature sessions for license agreements
CREATE TABLE IF NOT EXISTS rights_holder_signature_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_agreement_id UUID REFERENCES rights_holder_license_agreements(id) ON DELETE CASCADE,
    signer_email TEXT NOT NULL,
    signer_name TEXT NOT NULL,
    signature_token TEXT UNIQUE,
    is_signed BOOLEAN DEFAULT false,
    signed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================

-- Indexes for rights_holder_licenses
CREATE INDEX IF NOT EXISTS idx_rights_holder_licenses_rights_holder_id ON rights_holder_licenses(rights_holder_id);
CREATE INDEX IF NOT EXISTS idx_rights_holder_licenses_master_recording_id ON rights_holder_licenses(master_recording_id);
CREATE INDEX IF NOT EXISTS idx_rights_holder_licenses_buyer_id ON rights_holder_licenses(buyer_id);
CREATE INDEX IF NOT EXISTS idx_rights_holder_licenses_license_type ON rights_holder_licenses(license_type);
CREATE INDEX IF NOT EXISTS idx_rights_holder_licenses_status ON rights_holder_licenses(license_status);
CREATE INDEX IF NOT EXISTS idx_rights_holder_licenses_created_at ON rights_holder_licenses(created_at);

-- Indexes for rights_holder_revenue
CREATE INDEX IF NOT EXISTS idx_rights_holder_revenue_rights_holder_id ON rights_holder_revenue(rights_holder_id);
CREATE INDEX IF NOT EXISTS idx_rights_holder_revenue_license_id ON rights_holder_revenue(license_id);
CREATE INDEX IF NOT EXISTS idx_rights_holder_revenue_payment_status ON rights_holder_revenue(payment_status);

-- Indexes for royalty_distributions
CREATE INDEX IF NOT EXISTS idx_royalty_distributions_license_id ON royalty_distributions(license_id);
CREATE INDEX IF NOT EXISTS idx_royalty_distributions_rights_holder_id ON royalty_distributions(rights_holder_id);
CREATE INDEX IF NOT EXISTS idx_royalty_distributions_payment_status ON royalty_distributions(payment_status);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE rights_holder_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalty_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_license_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_license_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_signature_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rights_holder_licenses
DROP POLICY IF EXISTS "Rights holders can view their own licenses" ON rights_holder_licenses;
CREATE POLICY "Rights holders can view their own licenses" ON rights_holder_licenses
    FOR SELECT USING (rights_holder_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all licenses" ON rights_holder_licenses;
CREATE POLICY "Admins can view all licenses" ON rights_holder_licenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type IN ('admin', 'admin,producer')
        )
    );

-- RLS Policies for rights_holder_revenue
DROP POLICY IF EXISTS "Rights holders can view their own revenue" ON rights_holder_revenue;
CREATE POLICY "Rights holders can view their own revenue" ON rights_holder_revenue
    FOR SELECT USING (rights_holder_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all revenue" ON rights_holder_revenue;
CREATE POLICY "Admins can view all revenue" ON rights_holder_revenue
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type IN ('admin', 'admin,producer')
        )
    );

-- RLS Policies for rights_holder_balances
DROP POLICY IF EXISTS "Rights holders can view their own balances" ON rights_holder_balances;
CREATE POLICY "Rights holders can view their own balances" ON rights_holder_balances
    FOR SELECT USING (rights_holder_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all balances" ON rights_holder_balances;
CREATE POLICY "Admins can view all balances" ON rights_holder_balances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type IN ('admin', 'admin,producer')
        )
    );

-- RLS Policies for rights_holder_transactions
DROP POLICY IF EXISTS "Rights holders can view their own transactions" ON rights_holder_transactions;
CREATE POLICY "Rights holders can view their own transactions" ON rights_holder_transactions
    FOR SELECT USING (rights_holder_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all transactions" ON rights_holder_transactions;
CREATE POLICY "Admins can view all transactions" ON rights_holder_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type IN ('admin', 'admin,producer')
        )
    );

-- RLS Policies for royalty_distributions
DROP POLICY IF EXISTS "Rights holders can view their own royalty distributions" ON royalty_distributions;
CREATE POLICY "Rights holders can view their own royalty distributions" ON royalty_distributions
    FOR SELECT USING (rights_holder_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all royalty distributions" ON royalty_distributions;
CREATE POLICY "Admins can view all royalty distributions" ON royalty_distributions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type IN ('admin', 'admin,producer')
        )
    );

-- RLS Policies for license templates (read-only for all authenticated users)
DROP POLICY IF EXISTS "Authenticated users can view license templates" ON rights_holder_license_templates;
CREATE POLICY "Authenticated users can view license templates" ON rights_holder_license_templates
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for license agreements
DROP POLICY IF EXISTS "Rights holders can view their own agreements" ON rights_holder_license_agreements;
CREATE POLICY "Rights holders can view their own agreements" ON rights_holder_license_agreements
    FOR SELECT USING (license_id IN (
        SELECT id FROM rights_holder_licenses WHERE rights_holder_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Admins can view all agreements" ON rights_holder_license_agreements;
CREATE POLICY "Admins can view all agreements" ON rights_holder_license_agreements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type IN ('admin', 'admin,producer')
        )
    );

-- RLS Policies for signature sessions
DROP POLICY IF EXISTS "Rights holders can view their own signature sessions" ON rights_holder_signature_sessions;
CREATE POLICY "Rights holders can view their own signature sessions" ON rights_holder_signature_sessions
    FOR SELECT USING (license_agreement_id IN (
        SELECT id FROM rights_holder_license_agreements WHERE license_id IN (
            SELECT id FROM rights_holder_licenses WHERE rights_holder_id = auth.uid()
        )
    ));

DROP POLICY IF EXISTS "Admins can view all signature sessions" ON rights_holder_signature_sessions;
CREATE POLICY "Admins can view all signature sessions" ON rights_holder_signature_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type IN ('admin', 'admin,producer')
        )
    );

-- ============================================
-- 6. INTEGRATION FUNCTIONS
-- ============================================

-- Function to create rights holder license from existing stripe_orders
CREATE OR REPLACE FUNCTION create_rights_holder_license_from_checkout()
RETURNS TRIGGER AS $$
DECLARE
    v_master_recording_id uuid;
    v_rights_holder_id uuid;
    v_license_type text;
    v_amount numeric;
BEGIN
    -- Only process completed payments for rights holder content
    IF NEW.status != 'completed' OR NEW.metadata IS NULL THEN
        RETURN NEW;
    END IF;

    -- Check if this is rights holder content (has master_recording_id in metadata)
    IF NEW.metadata->>'master_recording_id' IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get master recording and rights holder info
    SELECT 
        mr.id,
        mr.rights_holder_id,
        CASE 
            WHEN NEW.metadata->>'license_type' = 'single_track' THEN 'single_track'
            WHEN NEW.metadata->>'license_type' = 'membership' THEN 'membership_license'
            WHEN NEW.metadata->>'license_type' = 'sync_proposal' THEN 'sync_proposal'
            WHEN NEW.metadata->>'license_type' = 'custom_sync' THEN 'custom_sync_request'
            ELSE 'single_track'
        END,
        NEW.amount
    INTO 
        v_master_recording_id,
        v_rights_holder_id,
        v_license_type,
        v_amount
    FROM master_recordings mr
    WHERE mr.id = (NEW.metadata->>'master_recording_id')::uuid;

    -- Create rights holder license record (only if it doesn't already exist)
    IF NOT EXISTS (
        SELECT 1 FROM rights_holder_licenses 
        WHERE stripe_payment_intent_id = NEW.stripe_session_id
    ) THEN
        INSERT INTO rights_holder_licenses (
            master_recording_id,
            rights_holder_id,
            buyer_id,
            license_type,
            amount,
            stripe_payment_intent_id,
            licensee_info,
            license_start_date
        )
        VALUES (
            v_master_recording_id,
            v_rights_holder_id,
            NEW.user_id,
            v_license_type,
            v_amount,
            NEW.stripe_session_id,
            jsonb_build_object(
                'user_id', NEW.user_id,
                'session_id', NEW.stripe_session_id,
                'metadata', NEW.metadata
            ),
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate rights holder earnings using existing commission structure
CREATE OR REPLACE FUNCTION calculate_rights_holder_earnings()
RETURNS TRIGGER AS $$
DECLARE
    v_compensation_settings record;
    v_commission_rate numeric;
    v_rights_holder_amount numeric;
    v_rights_holder_id uuid;
BEGIN
    -- Get rights holder ID
    v_rights_holder_id := NEW.rights_holder_id;
    
    -- Get compensation settings from existing system
    SELECT * INTO v_compensation_settings FROM compensation_settings LIMIT 1;
    
    -- Default settings if none exist
    IF v_compensation_settings IS NULL THEN
        v_compensation_settings := ROW(1, 75, 80, 90, 30, 50, 2, now(), now(), 2, 5, 3, 90)::compensation_settings;
    END IF;
    
    -- Determine commission rate based on license type
    CASE NEW.license_type
        WHEN 'single_track' THEN
            v_commission_rate := 1 - (v_compensation_settings.standard_rate / 100.0);
        WHEN 'membership_license' THEN
            v_commission_rate := 1 - (v_compensation_settings.standard_rate / 100.0);
        WHEN 'sync_proposal' THEN
            v_commission_rate := 1 - (v_compensation_settings.sync_fee_rate / 100.0);
        WHEN 'custom_sync_request' THEN
            v_commission_rate := 1 - (v_compensation_settings.custom_sync_rate / 100.0);
        WHEN 'exclusive_license' THEN
            v_commission_rate := 1 - (v_compensation_settings.exclusive_rate / 100.0);
        ELSE
            v_commission_rate := 1 - (v_compensation_settings.standard_rate / 100.0);
    END CASE;
    
    -- Calculate rights holder's share
    v_rights_holder_amount := NEW.amount * (1 - v_commission_rate);
    
    -- Create revenue record
    INSERT INTO rights_holder_revenue (
        rights_holder_id,
        license_id,
        revenue_type,
        amount,
        mybeatfi_commission,
        rights_holder_amount,
        payment_status
    )
    VALUES (
        v_rights_holder_id,
        NEW.id,
        CASE 
            WHEN NEW.license_type = 'sync_proposal' THEN 'sync_fee'
            WHEN NEW.license_type = 'membership_license' THEN 'membership_revenue'
            ELSE 'license_fee'
        END,
        NEW.amount,
        NEW.amount * v_commission_rate,
        v_rights_holder_amount,
        'pending'
    );
    
    -- Update rights holder balance
    INSERT INTO rights_holder_balances (
        rights_holder_id,
        pending_balance,
        available_balance,
        lifetime_earnings
    )
    VALUES (
        v_rights_holder_id,
        v_rights_holder_amount,
        0,
        v_rights_holder_amount
    )
    ON CONFLICT (rights_holder_id) DO UPDATE
    SET 
        pending_balance = rights_holder_balances.pending_balance + v_rights_holder_amount,
        lifetime_earnings = rights_holder_balances.lifetime_earnings + v_rights_holder_amount,
        updated_at = NOW();
    
    -- Create transaction record
    INSERT INTO rights_holder_transactions (
        rights_holder_id,
        amount,
        type,
        status,
        description,
        recording_title,
        reference_id
    )
    SELECT
        v_rights_holder_id,
        v_rights_holder_amount,
        CASE 
            WHEN NEW.license_type = 'sync_proposal' THEN 'sync_fee'
            WHEN NEW.license_type = 'membership_license' THEN 'membership_revenue'
            ELSE 'license_sale'
        END,
        'pending',
        'License Sale: ' || mr.title || ' (' || NEW.license_type || ')',
        mr.title,
        NEW.id::text
    FROM master_recordings mr
    WHERE mr.id = NEW.master_recording_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate royalty distributions
CREATE OR REPLACE FUNCTION calculate_royalty_distributions()
RETURNS TRIGGER AS $$
DECLARE
    v_participant record;
    v_amount_owed numeric;
BEGIN
    -- Get all participants for this recording
    FOR v_participant IN 
        SELECT 
            ssp.id as participant_id,
            ssp.participant_name,
            ssp.participant_role,
            ssp.percentage
        FROM split_sheet_participants ssp
        JOIN split_sheets ss ON ssp.split_sheet_id = ss.id
        WHERE ss.master_recording_id = NEW.master_recording_id
    LOOP
        -- Calculate amount owed to this participant
        v_amount_owed := NEW.amount * (v_participant.percentage / 100.0);
        
        -- Create royalty distribution record
        INSERT INTO royalty_distributions (
            license_id,
            master_recording_id,
            rights_holder_id,
            participant_id,
            participant_name,
            participant_role,
            percentage,
            amount_owed,
            payment_status
        )
        VALUES (
            NEW.id,
            NEW.master_recording_id,
            NEW.rights_holder_id,
            v_participant.participant_id,
            v_participant.participant_name,
            v_participant.participant_role,
            v_participant.percentage,
            v_amount_owed,
            'pending'
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Trigger to create rights holder licenses from stripe_orders
DROP TRIGGER IF EXISTS create_rights_holder_license_from_checkout_trigger ON stripe_orders;
CREATE TRIGGER create_rights_holder_license_from_checkout_trigger
    AFTER INSERT ON stripe_orders
    FOR EACH ROW
    EXECUTE FUNCTION create_rights_holder_license_from_checkout();

-- Trigger to calculate rights holder earnings
DROP TRIGGER IF EXISTS calculate_rights_holder_earnings_trigger ON rights_holder_licenses;
CREATE TRIGGER calculate_rights_holder_earnings_trigger
    AFTER INSERT ON rights_holder_licenses
    FOR EACH ROW
    EXECUTE FUNCTION calculate_rights_holder_earnings();

-- Trigger to calculate royalty distributions
DROP TRIGGER IF EXISTS calculate_royalty_distributions_trigger ON rights_holder_licenses;
CREATE TRIGGER calculate_royalty_distributions_trigger
    AFTER INSERT ON rights_holder_licenses
    FOR EACH ROW
    EXECUTE FUNCTION calculate_royalty_distributions();

-- ============================================
-- 8. DEFAULT LICENSE TEMPLATES
-- ============================================

-- Insert default license templates
INSERT INTO rights_holder_license_templates (template_name, template_type, template_content, version) VALUES
(
    'Standard Single Track License',
    'single_track',
    'This agreement grants the licensee the right to use the master recording for a single project. The rights holder retains all other rights and may license the same recording to other parties.',
    '1.0'
),
(
    'Sync License Agreement',
    'sync_license',
    'This agreement grants the licensee synchronization rights for use in visual media. The rights holder warrants they have the authority to grant these rights and will indemnify the licensee against any claims.',
    '1.0'
),
(
    'Exclusive License Agreement',
    'exclusive_license',
    'This agreement grants the licensee exclusive rights to the master recording for the specified territory and duration. The rights holder may not license the same recording to other parties during this period.',
    '1.0'
),
(
    'Membership License Agreement',
    'subscription_license',
    'This agreement grants the licensee access to the rights holder''s catalog through their membership plan. Usage is subject to the terms of their membership level.',
    '1.0'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. UPDATE EXISTING TABLES
-- ============================================

-- Add licensing-related columns to master_recordings
ALTER TABLE master_recordings 
ADD COLUMN IF NOT EXISTS total_licenses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(10,2) DEFAULT 0.00;

-- Add payout-related columns to rights_holders
ALTER TABLE rights_holders 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS payout_schedule TEXT DEFAULT 'monthly' CHECK (payout_schedule IN ('weekly', 'monthly', 'quarterly')),
ADD COLUMN IF NOT EXISTS minimum_payout_amount DECIMAL(10,2) DEFAULT 50.00;

-- ============================================
-- 10. VIEWS FOR REPORTING
-- ============================================

-- View for rights holder licensing summary
DROP VIEW IF EXISTS rights_holder_licensing_summary;
CREATE VIEW rights_holder_licensing_summary AS
SELECT 
    rh.id as rights_holder_id,
    rh.company_name,
    rh.rights_holder_type,
    COUNT(rhl.id) as total_licenses,
    SUM(rhl.amount) as total_revenue,
    SUM(rhr.rights_holder_amount) as total_earnings,
    rhb.pending_balance,
    rhb.available_balance,
    rhb.lifetime_earnings
FROM rights_holders rh
LEFT JOIN rights_holder_licenses rhl ON rh.id = rhl.rights_holder_id
LEFT JOIN rights_holder_revenue rhr ON rhl.id = rhr.license_id
LEFT JOIN rights_holder_balances rhb ON rh.id = rhb.rights_holder_id
GROUP BY rh.id, rh.company_name, rh.rights_holder_type, rhb.pending_balance, rhb.available_balance, rhb.lifetime_earnings;

-- View for royalty distribution summary
DROP VIEW IF EXISTS royalty_distribution_summary;
CREATE VIEW royalty_distribution_summary AS
SELECT 
    rd.license_id,
    rd.master_recording_id,
    rd.rights_holder_id,
    rh.company_name,
    mr.title as recording_title,
    COUNT(rd.id) as total_participants,
    SUM(rd.amount_owed) as total_amount_owed,
    SUM(rd.amount_paid) as total_amount_paid,
    SUM(rd.amount_owed - rd.amount_paid) as outstanding_amount
FROM royalty_distributions rd
JOIN rights_holders rh ON rd.rights_holder_id = rh.id
JOIN master_recordings mr ON rd.master_recording_id = mr.id
GROUP BY rd.license_id, rd.master_recording_id, rd.rights_holder_id, rh.company_name, mr.title;
