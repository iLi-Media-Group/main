-- Fix missing roster analytics views
-- This script creates the missing views that are causing the 400 error in the Roster Financial Reporting page

-- ============================================
-- 1. CREATE MISSING TABLES IF THEY DON'T EXIST
-- ============================================

-- Create roster_revenue_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS roster_revenue_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    roster_entity_id UUID REFERENCES roster_entities(id) ON DELETE CASCADE,
    rights_holder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('license_fee', 'sync_proposal', 'custom_sync', 'royalty_payment', 'advance_payment')),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    gross_amount DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled')),
    reference_id UUID,
    reference_type TEXT,
    track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
    client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create roster_monthly_revenue table if it doesn't exist
CREATE TABLE IF NOT EXISTS roster_monthly_revenue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    roster_entity_id UUID REFERENCES roster_entities(id) ON DELETE CASCADE,
    rights_holder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_gross_revenue DECIMAL(10,2) DEFAULT 0,
    total_net_revenue DECIMAL(10,2) DEFAULT 0,
    license_fee_revenue DECIMAL(10,2) DEFAULT 0,
    sync_proposal_revenue DECIMAL(10,2) DEFAULT 0,
    custom_sync_revenue DECIMAL(10,2) DEFAULT 0,
    royalty_payment_revenue DECIMAL(10,2) DEFAULT 0,
    advance_payment_revenue DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    pending_amount DECIMAL(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(roster_entity_id, year, month)
);

-- Create roster_payment_schedules table if it doesn't exist
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
-- 2. CREATE THE MISSING VIEWS
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
    COALESCE(SUM(rrt.gross_amount), 0) as total_gross_revenue,
    COALESCE(SUM(rrt.net_amount), 0) as total_net_revenue,
    COALESCE(SUM(CASE WHEN rrt.transaction_type = 'license_fee' THEN rrt.net_amount ELSE 0 END), 0) as license_fee_revenue,
    COALESCE(SUM(CASE WHEN rrt.transaction_type = 'sync_proposal' THEN rrt.net_amount ELSE 0 END), 0) as sync_proposal_revenue,
    COALESCE(SUM(CASE WHEN rrt.transaction_type = 'custom_sync' THEN rrt.net_amount ELSE 0 END), 0) as custom_sync_revenue,
    COALESCE(SUM(CASE WHEN rrt.transaction_type = 'royalty_payment' THEN rrt.net_amount ELSE 0 END), 0) as royalty_payment_revenue,
    COALESCE(SUM(CASE WHEN rrt.transaction_type = 'advance_payment' THEN rrt.net_amount ELSE 0 END), 0) as advance_payment_revenue,
    COUNT(DISTINCT CASE WHEN rrt.payment_status = 'paid' THEN rrt.id END) as paid_transactions,
    COUNT(DISTINCT CASE WHEN rrt.payment_status = 'pending' THEN rrt.id END) as pending_transactions,
    COALESCE(SUM(CASE WHEN rrt.payment_status = 'paid' THEN rrt.net_amount ELSE 0 END), 0) as paid_amount,
    COALESCE(SUM(CASE WHEN rrt.payment_status = 'pending' THEN rrt.net_amount ELSE 0 END), 0) as pending_amount
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
    COALESCE(SUM(rrt.gross_amount), 0) as total_gross_revenue_ytd,
    COALESCE(SUM(rrt.net_amount), 0) as total_net_revenue_ytd,
    COALESCE(SUM(CASE WHEN rrt.transaction_type = 'license_fee' THEN rrt.net_amount ELSE 0 END), 0) as license_fee_revenue_ytd,
    COALESCE(SUM(CASE WHEN rrt.transaction_type = 'sync_proposal' THEN rrt.net_amount ELSE 0 END), 0) as sync_proposal_revenue_ytd,
    COALESCE(SUM(CASE WHEN rrt.transaction_type = 'custom_sync' THEN rrt.net_amount ELSE 0 END), 0) as custom_sync_revenue_ytd,
    COALESCE(SUM(CASE WHEN rrt.transaction_type = 'royalty_payment' THEN rrt.net_amount ELSE 0 END), 0) as royalty_payment_revenue_ytd,
    COALESCE(SUM(CASE WHEN rrt.transaction_type = 'advance_payment' THEN rrt.net_amount ELSE 0 END), 0) as advance_payment_revenue_ytd,
    COUNT(DISTINCT CASE WHEN rrt.payment_status = 'paid' THEN rrt.id END) as paid_transactions_ytd,
    COALESCE(SUM(CASE WHEN rrt.payment_status = 'paid' THEN rrt.net_amount ELSE 0 END), 0) as paid_amount_ytd,
    COALESCE(SUM(CASE WHEN rrt.payment_status = 'pending' THEN rrt.net_amount ELSE 0 END), 0) as pending_amount_ytd
FROM roster_entities re
LEFT JOIN roster_revenue_transactions rrt ON rrt.roster_entity_id = re.id
WHERE re.is_active = true
  AND (rrt.transaction_date IS NULL OR EXTRACT(YEAR FROM rrt.transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE))
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
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE roster_revenue_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_monthly_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_payment_schedules ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Rights holders can manage own revenue transactions" ON roster_revenue_transactions;
DROP POLICY IF EXISTS "Rights holders can view own revenue transactions" ON roster_revenue_transactions;
DROP POLICY IF EXISTS "Rights holders can manage own monthly revenue" ON roster_monthly_revenue;
DROP POLICY IF EXISTS "Rights holders can view own monthly revenue" ON roster_monthly_revenue;
DROP POLICY IF EXISTS "Rights holders can manage own payment schedules" ON roster_payment_schedules;
DROP POLICY IF EXISTS "Rights holders can view own payment schedules" ON roster_payment_schedules;

-- Rights holders can manage their own revenue transactions
CREATE POLICY "Rights holders can manage own revenue transactions" ON roster_revenue_transactions
    FOR ALL USING (
        rights_holder_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'rights_holder'
        )
    );

-- Rights holders can view their own revenue transactions
CREATE POLICY "Rights holders can view own revenue transactions" ON roster_revenue_transactions
    FOR SELECT USING (
        rights_holder_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'rights_holder'
        )
    );

-- Rights holders can manage their own monthly revenue
CREATE POLICY "Rights holders can manage own monthly revenue" ON roster_monthly_revenue
    FOR ALL USING (
        rights_holder_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'rights_holder'
        )
    );

-- Rights holders can view their own monthly revenue
CREATE POLICY "Rights holders can view own monthly revenue" ON roster_monthly_revenue
    FOR SELECT USING (
        rights_holder_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'rights_holder'
        )
    );

-- Rights holders can manage their own payment schedules
CREATE POLICY "Rights holders can manage own payment schedules" ON roster_payment_schedules
    FOR ALL USING (
        rights_holder_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'rights_holder'
        )
    );

-- Rights holders can view their own payment schedules
CREATE POLICY "Rights holders can view own payment schedules" ON roster_payment_schedules
    FOR SELECT USING (
        rights_holder_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'rights_holder'
        )
    );

-- ============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Indexes for roster_revenue_transactions
CREATE INDEX IF NOT EXISTS idx_roster_revenue_transactions_roster_entity_id ON roster_revenue_transactions(roster_entity_id);
CREATE INDEX IF NOT EXISTS idx_roster_revenue_transactions_rights_holder_id ON roster_revenue_transactions(rights_holder_id);
CREATE INDEX IF NOT EXISTS idx_roster_revenue_transactions_transaction_date ON roster_revenue_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_roster_revenue_transactions_transaction_type ON roster_revenue_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_roster_revenue_transactions_payment_status ON roster_revenue_transactions(payment_status);

-- Indexes for roster_monthly_revenue
CREATE INDEX IF NOT EXISTS idx_roster_monthly_revenue_roster_entity_id ON roster_monthly_revenue(roster_entity_id);
CREATE INDEX IF NOT EXISTS idx_roster_monthly_revenue_rights_holder_id ON roster_monthly_revenue(rights_holder_id);
CREATE INDEX IF NOT EXISTS idx_roster_monthly_revenue_year_month ON roster_monthly_revenue(year, month);

-- Indexes for roster_payment_schedules
CREATE INDEX IF NOT EXISTS idx_roster_payment_schedules_roster_entity_id ON roster_payment_schedules(roster_entity_id);
CREATE INDEX IF NOT EXISTS idx_roster_payment_schedules_rights_holder_id ON roster_payment_schedules(rights_holder_id);
CREATE INDEX IF NOT EXISTS idx_roster_payment_schedules_payment_period ON roster_payment_schedules(payment_period_start, payment_period_end);

-- ============================================
-- 6. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE roster_revenue_transactions IS 'Detailed revenue transactions for roster entities with payment tracking';
COMMENT ON TABLE roster_monthly_revenue IS 'Monthly revenue summaries for roster entities';
COMMENT ON TABLE roster_payment_schedules IS 'Payment schedules and distributions for roster entities';
COMMENT ON VIEW roster_monthly_analytics IS 'Comprehensive monthly revenue analytics per roster entity';
COMMENT ON VIEW roster_ytd_analytics IS 'Year-to-date revenue summary per roster entity';
COMMENT ON VIEW roster_payment_tracking IS 'Payment tracking and status for roster entities';

-- ============================================
-- 7. VERIFY THE VIEWS WERE CREATED
-- ============================================

-- Check if views exist
SELECT 'roster_monthly_analytics' as view_name, EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_name = 'roster_monthly_analytics'
) as exists;

SELECT 'roster_ytd_analytics' as view_name, EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_name = 'roster_ytd_analytics'
) as exists;

SELECT 'roster_payment_tracking' as view_name, EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_name = 'roster_payment_tracking'
) as exists;
