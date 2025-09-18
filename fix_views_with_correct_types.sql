-- Fix roster views by dropping existing ones and recreating with correct types
-- This addresses the data type mismatch error

-- ============================================
-- 1. DROP EXISTING VIEWS FIRST
-- ============================================

DROP VIEW IF EXISTS roster_monthly_analytics CASCADE;
DROP VIEW IF EXISTS roster_ytd_analytics CASCADE;

-- ============================================
-- 2. CREATE VIEWS WITH CORRECT DATA TYPES
-- ============================================

-- Comprehensive monthly revenue view per roster entity
CREATE OR REPLACE VIEW roster_monthly_analytics AS
SELECT 
    re.id as roster_entity_id,
    re.name as entity_name,
    re.entity_type,
    re.rights_holder_id,
    EXTRACT(YEAR FROM CURRENT_DATE) as year,
    EXTRACT(MONTH FROM CURRENT_DATE) as month,
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
    EXTRACT(YEAR FROM CURRENT_DATE) as current_year,
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
-- 3. VERIFY ALL VIEWS WERE CREATED
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
