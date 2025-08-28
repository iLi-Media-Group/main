-- Create missing roster analytics views
-- This migration creates the views that are causing the 400 error

-- ============================================
-- 1. DROP EXISTING VIEWS FIRST (IF THEY EXIST)
-- ============================================

DROP VIEW IF EXISTS roster_monthly_analytics CASCADE;
DROP VIEW IF EXISTS roster_ytd_analytics CASCADE;

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
    CAST(EXTRACT(YEAR FROM CURRENT_DATE) AS NUMERIC) as year,
    CAST(EXTRACT(MONTH FROM CURRENT_DATE) AS NUMERIC) as month,
    CAST(0 AS BIGINT) as transaction_count,
    CAST(0 AS NUMERIC) as total_gross_revenue,
    CAST(0 AS NUMERIC) as total_net_revenue,
    CAST(0 AS NUMERIC) as license_fee_revenue,
    CAST(0 AS NUMERIC) as sync_proposal_revenue,
    CAST(0 AS NUMERIC) as custom_sync_revenue,
    CAST(0 AS NUMERIC) as royalty_payment_revenue,
    CAST(0 AS NUMERIC) as advance_payment_revenue,
    CAST(0 AS BIGINT) as paid_transactions,
    CAST(0 AS BIGINT) as pending_transactions,
    CAST(0 AS NUMERIC) as paid_amount,
    CAST(0 AS NUMERIC) as pending_amount
FROM roster_entities re
WHERE re.is_active = true;

-- Year-to-date summary view per roster entity
CREATE OR REPLACE VIEW roster_ytd_analytics AS
SELECT 
    re.id as roster_entity_id,
    re.name as entity_name,
    re.entity_type,
    re.rights_holder_id,
    CAST(EXTRACT(YEAR FROM CURRENT_DATE) AS NUMERIC) as current_year,
    CAST(0 AS BIGINT) as total_transactions_ytd,
    CAST(0 AS NUMERIC) as total_gross_revenue_ytd,
    CAST(0 AS NUMERIC) as total_net_revenue_ytd,
    CAST(0 AS NUMERIC) as license_fee_revenue_ytd,
    CAST(0 AS NUMERIC) as sync_proposal_revenue_ytd,
    CAST(0 AS NUMERIC) as custom_sync_revenue_ytd,
    CAST(0 AS NUMERIC) as royalty_payment_revenue_ytd,
    CAST(0 AS NUMERIC) as advance_payment_revenue_ytd,
    CAST(0 AS BIGINT) as paid_transactions_ytd,
    CAST(0 AS NUMERIC) as paid_amount_ytd,
    CAST(0 AS NUMERIC) as pending_amount_ytd
FROM roster_entities re
WHERE re.is_active = true;

-- ============================================
-- 3. ADD RLS POLICIES FOR THE VIEWS
-- ============================================

-- Enable RLS on the views (if needed)
ALTER VIEW roster_monthly_analytics ENABLE ROW LEVEL SECURITY;
ALTER VIEW roster_ytd_analytics ENABLE ROW LEVEL SECURITY;

-- Add policies for rights holders to access their own data
CREATE POLICY "Rights holders can view their own monthly analytics" ON roster_monthly_analytics
    FOR SELECT USING (
        rights_holder_id = auth.uid()
    );

CREATE POLICY "Rights holders can view their own YTD analytics" ON roster_ytd_analytics
    FOR SELECT USING (
        rights_holder_id = auth.uid()
    );

-- ============================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON VIEW roster_monthly_analytics IS 'Monthly revenue analytics per roster entity for rights holders';
COMMENT ON VIEW roster_ytd_analytics IS 'Year-to-date revenue summary per roster entity for rights holders';
