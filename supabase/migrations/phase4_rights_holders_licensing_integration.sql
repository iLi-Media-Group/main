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
    license_type TEXT NOT NULL CHECK (license_type IN ('single_track', 'sync_license', 'exclusive_license', 'subscription_license')),
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
    revenue_type TEXT NOT NULL CHECK (revenue_type IN ('license_fee', 'sync_fee', 'subscription_revenue', 'royalty_payment')),
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
    type TEXT NOT NULL CHECK (type IN ('license_sale', 'sync_fee', 'subscription_revenue', 'payout', 'refund')),
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
    template_type TEXT NOT NULL CHECK (template_type IN ('single_track', 'sync_license', 'exclusive_license', 'subscription_license')),
    template_content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    version TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated license agreements
CREATE TABLE IF NOT EXISTS rights_holder_license_agreements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_id UUID REFERENCES rights_holder_licenses(id) ON DELETE CASCADE,
    template_id UUID REFERENCES rights_holder_license_templates(id) ON DELETE SET NULL,
    agreement_content TEXT NOT NULL,
    pdf_url TEXT,
    is_signed BOOLEAN DEFAULT false,
    signed_at TIMESTAMP WITH TIME ZONE,
    signature_method TEXT CHECK (signature_method IN ('e_sign', 'click_accept', 'manual')),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. E-SIGNATURE INTEGRATION
-- ============================================

-- E-signature sessions for license agreements
CREATE TABLE IF NOT EXISTS rights_holder_signature_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_agreement_id UUID REFERENCES rights_holder_license_agreements(id) ON DELETE CASCADE,
    signer_email TEXT NOT NULL,
    signer_name TEXT NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_rights_holder_licenses_rights_holder_id ON rights_holder_licenses(rights_holder_id);
CREATE INDEX IF NOT EXISTS idx_rights_holder_licenses_master_recording_id ON rights_holder_licenses(master_recording_id);
CREATE INDEX IF NOT EXISTS idx_rights_holder_licenses_buyer_id ON rights_holder_licenses(buyer_id);
CREATE INDEX IF NOT EXISTS idx_rights_holder_licenses_license_status ON rights_holder_licenses(license_status);
CREATE INDEX IF NOT EXISTS idx_rights_holder_licenses_created_at ON rights_holder_licenses(created_at);

CREATE INDEX IF NOT EXISTS idx_rights_holder_revenue_rights_holder_id ON rights_holder_revenue(rights_holder_id);
CREATE INDEX IF NOT EXISTS idx_rights_holder_revenue_license_id ON rights_holder_revenue(license_id);
CREATE INDEX IF NOT EXISTS idx_rights_holder_revenue_payment_status ON rights_holder_revenue(payment_status);
CREATE INDEX IF NOT EXISTS idx_rights_holder_revenue_created_at ON rights_holder_revenue(created_at);

CREATE INDEX IF NOT EXISTS idx_rights_holder_transactions_rights_holder_id ON rights_holder_transactions(rights_holder_id);
CREATE INDEX IF NOT EXISTS idx_rights_holder_transactions_type ON rights_holder_transactions(type);
CREATE INDEX IF NOT EXISTS idx_rights_holder_transactions_status ON rights_holder_transactions(status);
CREATE INDEX IF NOT EXISTS idx_rights_holder_transactions_created_at ON rights_holder_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_royalty_distributions_license_id ON royalty_distributions(license_id);
CREATE INDEX IF NOT EXISTS idx_royalty_distributions_master_recording_id ON royalty_distributions(master_recording_id);
CREATE INDEX IF NOT EXISTS idx_royalty_distributions_rights_holder_id ON royalty_distributions(rights_holder_id);
CREATE INDEX IF NOT EXISTS idx_royalty_distributions_payment_status ON royalty_distributions(payment_status);

CREATE INDEX IF NOT EXISTS idx_rights_holder_signature_sessions_session_token ON rights_holder_signature_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_rights_holder_signature_sessions_status ON rights_holder_signature_sessions(status);
CREATE INDEX IF NOT EXISTS idx_rights_holder_signature_sessions_expires_at ON rights_holder_signature_sessions(expires_at);

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE rights_holder_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalty_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_license_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_license_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_signature_sessions ENABLE ROW LEVEL SECURITY;

-- Rights holder licenses policies
CREATE POLICY "Rights holders can view their own licenses" ON rights_holder_licenses
    FOR SELECT USING (rights_holder_id = auth.uid());

CREATE POLICY "Buyers can view their own licenses" ON rights_holder_licenses
    FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Admins can view all licenses" ON rights_holder_licenses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- Rights holder revenue policies
CREATE POLICY "Rights holders can view their own revenue" ON rights_holder_revenue
    FOR SELECT USING (rights_holder_id = auth.uid());

CREATE POLICY "Admins can view all revenue" ON rights_holder_revenue
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- Rights holder balances policies
CREATE POLICY "Rights holders can view their own balances" ON rights_holder_balances
    FOR SELECT USING (rights_holder_id = auth.uid());

CREATE POLICY "Admins can view all balances" ON rights_holder_balances
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- Rights holder transactions policies
CREATE POLICY "Rights holders can view their own transactions" ON rights_holder_transactions
    FOR SELECT USING (rights_holder_id = auth.uid());

CREATE POLICY "Admins can view all transactions" ON rights_holder_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- Royalty distributions policies
CREATE POLICY "Rights holders can view their own royalty distributions" ON royalty_distributions
    FOR SELECT USING (rights_holder_id = auth.uid());

CREATE POLICY "Admins can view all royalty distributions" ON royalty_distributions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- License templates policies (read-only for rights holders, full access for admins)
CREATE POLICY "Everyone can view active license templates" ON rights_holder_license_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage license templates" ON rights_holder_license_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- License agreements policies
CREATE POLICY "Rights holders can view their own license agreements" ON rights_holder_license_agreements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rights_holder_licenses 
            WHERE id = license_id 
            AND rights_holder_id = auth.uid()
        )
    );

CREATE POLICY "Buyers can view their own license agreements" ON rights_holder_license_agreements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rights_holder_licenses 
            WHERE id = license_id 
            AND buyer_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all license agreements" ON rights_holder_license_agreements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- Signature sessions policies
CREATE POLICY "Signers can view their own signature sessions" ON rights_holder_signature_sessions
    FOR SELECT USING (signer_email = (
        SELECT email FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can view all signature sessions" ON rights_holder_signature_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- ============================================
-- 7. FUNCTIONS FOR AUTOMATION
-- ============================================

-- Function to create rights holder license from Stripe payment
CREATE OR REPLACE FUNCTION create_rights_holder_license_from_checkout()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
    v_master_recording_id uuid;
    v_rights_holder_id uuid;
    v_profile_data json;
BEGIN
    -- Only process completed payments
    IF NEW.payment_status != 'paid' OR NEW.status != 'completed' THEN
        RETURN NEW;
    END IF;

    -- Get the user_id for this customer
    SELECT user_id INTO v_user_id
    FROM stripe_customers
    WHERE customer_id = NEW.customer_id;

    -- Check if we have master_recording_id in metadata
    IF NEW.metadata IS NOT NULL AND NEW.metadata->>'master_recording_id' IS NOT NULL THEN
        -- Get master_recording_id and rights_holder_id
        v_master_recording_id := (NEW.metadata->>'master_recording_id')::uuid;
        
        -- Get rights_holder_id for this recording
        SELECT rights_holder_id INTO v_rights_holder_id
        FROM master_recordings
        WHERE id = v_master_recording_id;
        
        -- Get user profile data for licensee info
        SELECT 
            json_build_object(
                'name', COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''),
                'email', email
            ) INTO v_profile_data
        FROM profiles
        WHERE id = v_user_id;
        
        -- Create license record if it doesn't already exist
        INSERT INTO rights_holder_licenses (
            master_recording_id,
            rights_holder_id,
            buyer_id,
            license_type,
            amount,
            payment_method,
            transaction_id,
            stripe_payment_intent_id,
            licensee_info
        )
        SELECT
            v_master_recording_id,
            v_rights_holder_id,
            v_user_id,
            'single_track',
            NEW.amount_total / 100, -- Convert from cents to dollars
            'stripe',
            NEW.payment_intent_id,
            NEW.payment_intent_id,
            v_profile_data
        WHERE NOT EXISTS (
            -- Check if this transaction already has a license record
            SELECT 1 FROM rights_holder_licenses 
            WHERE transaction_id = NEW.payment_intent_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate rights holder earnings
CREATE OR REPLACE FUNCTION calculate_rights_holder_earnings()
RETURNS TRIGGER AS $$
DECLARE
    v_mybeatfi_commission_rate numeric := 0.30; -- 30% commission
    v_rights_holder_amount numeric;
    v_rights_holder_id uuid;
BEGIN
    -- Get rights holder ID
    v_rights_holder_id := NEW.rights_holder_id;
    
    -- Calculate rights holder's share (70% of license amount)
    v_rights_holder_amount := NEW.amount * (1 - v_mybeatfi_commission_rate);
    
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
        'license_fee',
        NEW.amount,
        NEW.amount * v_mybeatfi_commission_rate,
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
        'license_sale',
        'pending',
        'License Sale: ' || mr.title,
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
-- 8. TRIGGERS
-- ============================================

-- Trigger to create rights holder licenses from Stripe payments
DROP TRIGGER IF EXISTS create_rights_holder_license_from_checkout_trigger ON stripe_orders;
CREATE TRIGGER create_rights_holder_license_from_checkout_trigger
    AFTER INSERT OR UPDATE ON stripe_orders
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
-- 9. DEFAULT LICENSE TEMPLATES
-- ============================================

-- Insert default license templates
INSERT INTO rights_holder_license_templates (template_name, template_type, template_content, version, created_by) VALUES
(
    'Standard Single Track License',
    'single_track',
    'This Music Synchronization License Agreement ("Agreement") is entered into between the Rights Holder and the Licensee for the use of the master recording "{recording_title}" in synchronization with visual media.

TERMS:
1. License Type: Single Track Synchronization License
2. Territory: Worldwide
3. Duration: Perpetual
4. Usage: Synchronization with visual media only
5. Rights Granted: Non-exclusive right to synchronize the recording with visual media
6. Restrictions: No public performance rights, no mechanical rights
7. Payment: {amount} USD paid in full
8. Credits: Licensee agrees to provide appropriate credits where possible

The Rights Holder represents and warrants that they have the authority to grant this license and that the recording does not infringe upon any third-party rights.',
    '1.0',
    NULL
),
(
    'Sync License Agreement',
    'sync_license',
    'This Sync License Agreement ("Agreement") is entered into between the Rights Holder and the Licensee for the use of the master recording "{recording_title}" in synchronization with visual media.

TERMS:
1. License Type: Sync License
2. Territory: {territory}
3. Duration: {duration}
4. Usage: Synchronization with visual media as specified
5. Rights Granted: Non-exclusive sync rights
6. Payment: {amount} USD
7. Credits: Required where possible
8. Restrictions: No public performance or mechanical rights

The Rights Holder represents and warrants their authority to grant this license.',
    '1.0',
    NULL
),
(
    'Exclusive License Agreement',
    'exclusive_license',
    'This Exclusive License Agreement ("Agreement") is entered into between the Rights Holder and the Licensee for the exclusive use of the master recording "{recording_title}".

TERMS:
1. License Type: Exclusive License
2. Territory: {territory}
3. Duration: {duration}
4. Usage: Exclusive rights as specified
5. Rights Granted: Exclusive rights for specified use
6. Payment: {amount} USD
7. Credits: Required
8. Exclusivity: Rights Holder agrees not to license to others during term

The Rights Holder represents and warrants their authority to grant exclusive rights.',
    '1.0',
    NULL
);

-- ============================================
-- 10. UPDATE EXISTING TABLES
-- ============================================

-- Add license tracking to master_recordings table
ALTER TABLE master_recordings 
ADD COLUMN IF NOT EXISTS total_licenses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(10,2) DEFAULT 0.00;

-- Add payment tracking to rights_holders table
ALTER TABLE rights_holders 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS payout_schedule TEXT DEFAULT 'monthly' CHECK (payout_schedule IN ('weekly', 'monthly', 'quarterly')),
ADD COLUMN IF NOT EXISTS minimum_payout_amount DECIMAL(10,2) DEFAULT 50.00;

-- ============================================
-- 11. VIEWS FOR REPORTING
-- ============================================

-- View for rights holder licensing summary
CREATE OR REPLACE VIEW rights_holder_licensing_summary AS
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
CREATE OR REPLACE VIEW royalty_distribution_summary AS
SELECT 
    rd.master_recording_id,
    mr.title as recording_title,
    rd.rights_holder_id,
    rh.company_name,
    rd.participant_name,
    rd.participant_role,
    rd.percentage,
    SUM(rd.amount_owed) as total_owed,
    SUM(rd.amount_paid) as total_paid,
    SUM(rd.amount_owed - rd.amount_paid) as outstanding_amount
FROM royalty_distributions rd
JOIN master_recordings mr ON rd.master_recording_id = mr.id
JOIN rights_holders rh ON rd.rights_holder_id = rh.id
GROUP BY rd.master_recording_id, mr.title, rd.rights_holder_id, rh.company_name, rd.participant_name, rd.participant_role, rd.percentage;

COMMIT;
