-- Enhanced Roster Financial Reporting System
-- This migration adds comprehensive financial tracking and reporting capabilities
-- for rights holders to manage their roster artists' revenue and payments

-- ============================================
-- 1. ENHANCED FINANCIAL TRACKING TABLES
-- ============================================

-- Table to track detailed revenue transactions per roster entity
CREATE TABLE IF NOT EXISTS roster_revenue_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    roster_entity_id UUID REFERENCES roster_entities(id) ON DELETE CASCADE,
    rights_holder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('license_fee', 'sync_proposal', 'custom_sync', 'royalty_payment', 'advance_payment')),
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    gross_amount DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    commission_amount DECIMAL(10,2) DEFAULT 0.00,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled')),
    payment_date TIMESTAMP WITH TIME ZONE,
    reference_id TEXT, -- ID of the original transaction (sync_proposal_id, custom_sync_id, etc.)
    reference_type TEXT, -- Type of reference ('sync_proposal', 'custom_sync', 'license', etc.)
    track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
    client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track monthly revenue summaries per roster entity
CREATE TABLE IF NOT EXISTS roster_monthly_revenue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    roster_entity_id UUID REFERENCES roster_entities(id) ON DELETE CASCADE,
    rights_holder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    total_gross_revenue DECIMAL(10,2) DEFAULT 0.00,
    total_net_revenue DECIMAL(10,2) DEFAULT 0.00,
    license_fee_revenue DECIMAL(10,2) DEFAULT 0.00,
    sync_proposal_revenue DECIMAL(10,2) DEFAULT 0.00,
    custom_sync_revenue DECIMAL(10,2) DEFAULT 0.00,
    royalty_payment_revenue DECIMAL(10,2) DEFAULT 0.00,
    advance_payment_revenue DECIMAL(10,2) DEFAULT 0.00,
    transaction_count INTEGER DEFAULT 0,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue')),
    payment_due_date TIMESTAMP WITH TIME ZONE,
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(roster_entity_id, year, month)
);

-- Table to track payment schedules and distributions
CREATE TABLE IF NOT EXISTS roster_payment_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    roster_entity_id UUID REFERENCES roster_entities(id) ON DELETE CASCADE,
    rights_holder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    payment_period_start DATE NOT NULL,
    payment_period_end DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'paypal', 'check', 'wire_transfer', 'ach')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processed', 'paid', 'failed', 'cancelled')),
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_reference TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. ENHANCED ANALYTICS VIEWS
-- ============================================

-- Comprehensive monthly revenue view per roster entity
CREATE OR REPLACE VIEW roster_monthly_analytics AS
SELECT 
    re.id as roster_entity_id,
    re.name as entity_name,
    re.entity_type,
    re.rights_holder_id,
    EXTRACT(YEAR FROM rrt.transaction_date) as year,
    EXTRACT(MONTH FROM rrt.transaction_date) as month,
    COUNT(DISTINCT rrt.id) as transaction_count,
    SUM(rrt.gross_amount) as total_gross_revenue,
    SUM(rrt.net_amount) as total_net_revenue,
    SUM(CASE WHEN rrt.transaction_type = 'license_fee' THEN rrt.net_amount ELSE 0 END) as license_fee_revenue,
    SUM(CASE WHEN rrt.transaction_type = 'sync_proposal' THEN rrt.net_amount ELSE 0 END) as sync_proposal_revenue,
    SUM(CASE WHEN rrt.transaction_type = 'custom_sync' THEN rrt.net_amount ELSE 0 END) as custom_sync_revenue,
    SUM(CASE WHEN rrt.transaction_type = 'royalty_payment' THEN rrt.net_amount ELSE 0 END) as royalty_payment_revenue,
    SUM(CASE WHEN rrt.transaction_type = 'advance_payment' THEN rrt.net_amount ELSE 0 END) as advance_payment_revenue,
    COUNT(DISTINCT CASE WHEN rrt.payment_status = 'paid' THEN rrt.id END) as paid_transactions,
    COUNT(DISTINCT CASE WHEN rrt.payment_status = 'pending' THEN rrt.id END) as pending_transactions,
    SUM(CASE WHEN rrt.payment_status = 'paid' THEN rrt.net_amount ELSE 0 END) as paid_amount,
    SUM(CASE WHEN rrt.payment_status = 'pending' THEN rrt.net_amount ELSE 0 END) as pending_amount
FROM roster_entities re
LEFT JOIN roster_revenue_transactions rrt ON rrt.roster_entity_id = re.id
WHERE re.is_active = true
GROUP BY re.id, re.name, re.entity_type, re.rights_holder_id, 
         EXTRACT(YEAR FROM rrt.transaction_date), EXTRACT(MONTH FROM rrt.transaction_date)
ORDER BY re.name, year DESC, month DESC;

-- Year-to-date summary view per roster entity
CREATE OR REPLACE VIEW roster_ytd_analytics AS
SELECT 
    re.id as roster_entity_id,
    re.name as entity_name,
    re.entity_type,
    re.rights_holder_id,
    EXTRACT(YEAR FROM CURRENT_DATE) as current_year,
    COUNT(DISTINCT rrt.id) as total_transactions_ytd,
    SUM(rrt.gross_amount) as total_gross_revenue_ytd,
    SUM(rrt.net_amount) as total_net_revenue_ytd,
    SUM(CASE WHEN rrt.transaction_type = 'license_fee' THEN rrt.net_amount ELSE 0 END) as license_fee_revenue_ytd,
    SUM(CASE WHEN rrt.transaction_type = 'sync_proposal' THEN rrt.net_amount ELSE 0 END) as sync_proposal_revenue_ytd,
    SUM(CASE WHEN rrt.transaction_type = 'custom_sync' THEN rrt.net_amount ELSE 0 END) as custom_sync_revenue_ytd,
    SUM(CASE WHEN rrt.transaction_type = 'royalty_payment' THEN rrt.net_amount ELSE 0 END) as royalty_payment_revenue_ytd,
    SUM(CASE WHEN rrt.transaction_type = 'advance_payment' THEN rrt.net_amount ELSE 0 END) as advance_payment_revenue_ytd,
    COUNT(DISTINCT CASE WHEN rrt.payment_status = 'paid' THEN rrt.id END) as paid_transactions_ytd,
    SUM(CASE WHEN rrt.payment_status = 'paid' THEN rrt.net_amount ELSE 0 END) as paid_amount_ytd,
    SUM(CASE WHEN rrt.payment_status = 'pending' THEN rrt.net_amount ELSE 0 END) as pending_amount_ytd
FROM roster_entities re
LEFT JOIN roster_revenue_transactions rrt ON rrt.roster_entity_id = re.id
WHERE re.is_active = true
  AND EXTRACT(YEAR FROM rrt.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY re.id, re.name, re.entity_type, re.rights_holder_id
ORDER BY total_net_revenue_ytd DESC;

-- Payment tracking view for rights holders
CREATE OR REPLACE VIEW roster_payment_tracking AS
SELECT 
    re.id as roster_entity_id,
    re.name as entity_name,
    re.entity_type,
    re.rights_holder_id,
    rps.payment_period_start,
    rps.payment_period_end,
    rps.total_amount,
    rps.payment_method,
    rps.payment_status,
    rps.payment_date,
    rps.payment_reference,
    rps.notes,
    CASE 
        WHEN rps.payment_status = 'pending' AND rps.payment_period_end < CURRENT_DATE 
        THEN 'overdue'
        WHEN rps.payment_status = 'pending' AND rps.payment_period_end >= CURRENT_DATE 
        THEN 'due'
        ELSE rps.payment_status
    END as payment_status_display
FROM roster_entities re
JOIN roster_payment_schedules rps ON rps.roster_entity_id = re.id
WHERE re.is_active = true
ORDER BY rps.payment_period_end DESC;

-- ============================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================

-- Indexes for roster_revenue_transactions
CREATE INDEX IF NOT EXISTS idx_roster_revenue_transactions_roster_entity_id ON roster_revenue_transactions(roster_entity_id);
CREATE INDEX IF NOT EXISTS idx_roster_revenue_transactions_rights_holder_id ON roster_revenue_transactions(rights_holder_id);
CREATE INDEX IF NOT EXISTS idx_roster_revenue_transactions_transaction_date ON roster_revenue_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_roster_revenue_transactions_transaction_type ON roster_revenue_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_roster_revenue_transactions_payment_status ON roster_revenue_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_roster_revenue_transactions_reference ON roster_revenue_transactions(reference_id, reference_type);

-- Indexes for roster_monthly_revenue
CREATE INDEX IF NOT EXISTS idx_roster_monthly_revenue_roster_entity_id ON roster_monthly_revenue(roster_entity_id);
CREATE INDEX IF NOT EXISTS idx_roster_monthly_revenue_rights_holder_id ON roster_monthly_revenue(rights_holder_id);
CREATE INDEX IF NOT EXISTS idx_roster_monthly_revenue_year_month ON roster_monthly_revenue(year, month);
CREATE INDEX IF NOT EXISTS idx_roster_monthly_revenue_payment_status ON roster_monthly_revenue(payment_status);

-- Indexes for roster_payment_schedules
CREATE INDEX IF NOT EXISTS idx_roster_payment_schedules_roster_entity_id ON roster_payment_schedules(roster_entity_id);
CREATE INDEX IF NOT EXISTS idx_roster_payment_schedules_rights_holder_id ON roster_payment_schedules(rights_holder_id);
CREATE INDEX IF NOT EXISTS idx_roster_payment_schedules_payment_period ON roster_payment_schedules(payment_period_start, payment_period_end);
CREATE INDEX IF NOT EXISTS idx_roster_payment_schedules_payment_status ON roster_payment_schedules(payment_status);

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE roster_revenue_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_monthly_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_payment_schedules ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- Rights holders can manage their own revenue transactions
CREATE POLICY "Rights holders can manage own revenue transactions" ON roster_revenue_transactions
    FOR ALL USING (
        rights_holder_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND rights_holder_type IN ('record_label', 'publisher')
        )
    );

-- Service role can manage revenue transactions for automated processes
CREATE POLICY "Service role can manage revenue transactions" ON roster_revenue_transactions
    FOR ALL USING (auth.role() = 'service_role');

-- Rights holders can manage their own monthly revenue
CREATE POLICY "Rights holders can manage own monthly revenue" ON roster_monthly_revenue
    FOR ALL USING (
        rights_holder_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND rights_holder_type IN ('record_label', 'publisher')
        )
    );

-- Service role can manage monthly revenue for automated processes
CREATE POLICY "Service role can manage monthly revenue" ON roster_monthly_revenue
    FOR ALL USING (auth.role() = 'service_role');

-- Rights holders can manage their own payment schedules
CREATE POLICY "Rights holders can manage own payment schedules" ON roster_payment_schedules
    FOR ALL USING (
        rights_holder_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND rights_holder_type IN ('record_label', 'publisher')
        )
    );

-- Service role can manage payment schedules for automated processes
CREATE POLICY "Service role can manage payment schedules" ON roster_payment_schedules
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 6. TRIGGERS FOR UPDATED_AT
-- ============================================

-- Triggers for roster_revenue_transactions
CREATE TRIGGER update_roster_revenue_transactions_updated_at 
    BEFORE UPDATE ON roster_revenue_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for roster_monthly_revenue
CREATE TRIGGER update_roster_monthly_revenue_updated_at 
    BEFORE UPDATE ON roster_monthly_revenue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for roster_payment_schedules
CREATE TRIGGER update_roster_payment_schedules_updated_at 
    BEFORE UPDATE ON roster_payment_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to calculate roster entity revenue for a specific period
CREATE OR REPLACE FUNCTION calculate_roster_entity_revenue(
    entity_id UUID,
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    total_gross_revenue DECIMAL,
    total_net_revenue DECIMAL,
    license_fee_revenue DECIMAL,
    sync_proposal_revenue DECIMAL,
    custom_sync_revenue DECIMAL,
    royalty_payment_revenue DECIMAL,
    advance_payment_revenue DECIMAL,
    transaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(rrt.gross_amount), 0) as total_gross_revenue,
        COALESCE(SUM(rrt.net_amount), 0) as total_net_revenue,
        COALESCE(SUM(CASE WHEN rrt.transaction_type = 'license_fee' THEN rrt.net_amount ELSE 0 END), 0) as license_fee_revenue,
        COALESCE(SUM(CASE WHEN rrt.transaction_type = 'sync_proposal' THEN rrt.net_amount ELSE 0 END), 0) as sync_proposal_revenue,
        COALESCE(SUM(CASE WHEN rrt.transaction_type = 'custom_sync' THEN rrt.net_amount ELSE 0 END), 0) as custom_sync_revenue,
        COALESCE(SUM(CASE WHEN rrt.transaction_type = 'royalty_payment' THEN rrt.net_amount ELSE 0 END), 0) as royalty_payment_revenue,
        COALESCE(SUM(CASE WHEN rrt.transaction_type = 'advance_payment' THEN rrt.net_amount ELSE 0 END), 0) as advance_payment_revenue,
        COUNT(rrt.id) as transaction_count
    FROM roster_revenue_transactions rrt
    WHERE rrt.roster_entity_id = entity_id
      AND rrt.transaction_date >= start_date
      AND rrt.transaction_date <= end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate monthly revenue summary
CREATE OR REPLACE FUNCTION generate_monthly_revenue_summary(
    entity_id UUID,
    year INTEGER,
    month INTEGER
)
RETURNS VOID AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    revenue_data RECORD;
BEGIN
    -- Calculate date range for the month
    start_date := DATE(year || '-' || LPAD(month::TEXT, 2, '0') || '-01');
    end_date := start_date + INTERVAL '1 month' - INTERVAL '1 day';
    
    -- Get revenue data for the period
    SELECT * INTO revenue_data
    FROM calculate_roster_entity_revenue(entity_id, start_date, end_date);
    
    -- Insert or update monthly revenue record
    INSERT INTO roster_monthly_revenue (
        roster_entity_id,
        rights_holder_id,
        year,
        month,
        total_gross_revenue,
        total_net_revenue,
        license_fee_revenue,
        sync_proposal_revenue,
        custom_sync_revenue,
        royalty_payment_revenue,
        advance_payment_revenue,
        transaction_count
    )
    SELECT 
        re.id,
        re.rights_holder_id,
        year,
        month,
        revenue_data.total_gross_revenue,
        revenue_data.total_net_revenue,
        revenue_data.license_fee_revenue,
        revenue_data.sync_proposal_revenue,
        revenue_data.custom_sync_revenue,
        revenue_data.royalty_payment_revenue,
        revenue_data.advance_payment_revenue,
        revenue_data.transaction_count
    FROM roster_entities re
    WHERE re.id = entity_id
    ON CONFLICT (roster_entity_id, year, month) DO UPDATE
    SET 
        total_gross_revenue = EXCLUDED.total_gross_revenue,
        total_net_revenue = EXCLUDED.total_net_revenue,
        license_fee_revenue = EXCLUDED.license_fee_revenue,
        sync_proposal_revenue = EXCLUDED.sync_proposal_revenue,
        custom_sync_revenue = EXCLUDED.custom_sync_revenue,
        royalty_payment_revenue = EXCLUDED.royalty_payment_revenue,
        advance_payment_revenue = EXCLUDED.advance_payment_revenue,
        transaction_count = EXCLUDED.transaction_count,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE roster_revenue_transactions IS 'Detailed revenue transactions for roster entities with payment tracking';
COMMENT ON TABLE roster_monthly_revenue IS 'Monthly revenue summaries for roster entities';
COMMENT ON TABLE roster_payment_schedules IS 'Payment schedules and distributions for roster entities';
COMMENT ON VIEW roster_monthly_analytics IS 'Comprehensive monthly revenue analytics per roster entity';
COMMENT ON VIEW roster_ytd_analytics IS 'Year-to-date revenue summary per roster entity';
COMMENT ON VIEW roster_payment_tracking IS 'Payment tracking and status for roster entities';
COMMENT ON FUNCTION calculate_roster_entity_revenue IS 'Calculate revenue for a roster entity over a specific period';
COMMENT ON FUNCTION generate_monthly_revenue_summary IS 'Generate monthly revenue summary for a roster entity';

-- ============================================
-- 9. INITIAL DATA MIGRATION
-- ============================================

-- Create initial revenue transactions from existing sync proposals
INSERT INTO roster_revenue_transactions (
    roster_entity_id,
    rights_holder_id,
    transaction_type,
    transaction_date,
    gross_amount,
    net_amount,
    payment_status,
    reference_id,
    reference_type,
    track_id,
    client_id,
    description
)
SELECT 
    t.roster_entity_id,
    re.rights_holder_id,
    'sync_proposal' as transaction_type,
    sp.created_at as transaction_date,
    COALESCE(sp.final_amount::DECIMAL(10,2), sp.negotiated_amount::DECIMAL(10,2), sp.sync_fee::DECIMAL(10,2)) as gross_amount,
    COALESCE(sp.final_amount::DECIMAL(10,2), sp.negotiated_amount::DECIMAL(10,2), sp.sync_fee::DECIMAL(10,2)) * 0.70 as net_amount, -- Assuming 70% artist share
    CASE WHEN sp.payment_status = 'paid' THEN 'paid' ELSE 'pending' END as payment_status,
    sp.id::TEXT as reference_id,
    'sync_proposal' as reference_type,
    sp.track_id,
    sp.client_id,
    'Sync Proposal: ' || COALESCE(t.title, 'Unknown Track')
FROM sync_proposals sp
JOIN tracks t ON t.id = sp.track_id
JOIN roster_entities re ON re.id = t.roster_entity_id
WHERE t.roster_entity_id IS NOT NULL
  AND sp.status = 'accepted'
  AND sp.id::TEXT NOT IN (
    SELECT reference_id FROM roster_revenue_transactions 
    WHERE reference_type = 'sync_proposal'
  );

-- Create initial revenue transactions from existing custom sync requests
INSERT INTO roster_revenue_transactions (
    roster_entity_id,
    rights_holder_id,
    transaction_type,
    transaction_date,
    gross_amount,
    net_amount,
    payment_status,
    reference_id,
    reference_type,
    client_id,
    description
)
SELECT 
    re.id as roster_entity_id,
    re.rights_holder_id,
    'custom_sync' as transaction_type,
    csr.created_at as transaction_date,
    COALESCE(csr.final_amount::DECIMAL(10,2), csr.negotiated_amount::DECIMAL(10,2), csr.sync_fee::DECIMAL(10,2)) as gross_amount,
    COALESCE(csr.final_amount::DECIMAL(10,2), csr.negotiated_amount::DECIMAL(10,2), csr.sync_fee::DECIMAL(10,2)) * 0.70 as net_amount, -- Assuming 70% artist share
    CASE WHEN csr.payment_status = 'paid' THEN 'paid' ELSE 'pending' END as payment_status,
    csr.id::TEXT as reference_id,
    'custom_sync' as reference_type,
    csr.client_id,
    'Custom Sync: ' || COALESCE(csr.project_title, 'Custom Sync Request')
FROM custom_sync_requests csr
JOIN roster_entities re ON re.id = csr.selected_rights_holder_id
WHERE csr.selected_rights_holder_id IS NOT NULL
  AND csr.status IN ('completed', 'accepted')
  AND csr.id::TEXT NOT IN (
    SELECT reference_id FROM roster_revenue_transactions 
    WHERE reference_type = 'custom_sync'
  );

COMMIT;
