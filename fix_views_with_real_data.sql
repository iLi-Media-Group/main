-- Fix roster views to use real existing data sources
-- This creates views that actually work with your existing tables

-- ============================================
-- 1. DROP EXISTING VIEWS FIRST
-- ============================================

DROP VIEW IF EXISTS roster_monthly_analytics CASCADE;
DROP VIEW IF EXISTS roster_ytd_analytics CASCADE;

-- ============================================
-- 2. CREATE VIEWS WITH REAL DATA SOURCES
-- ============================================

-- Comprehensive monthly revenue view per roster entity
CREATE OR REPLACE VIEW roster_monthly_analytics AS
SELECT 
    re.id as roster_entity_id,
    re.name as entity_name,
    re.entity_type,
    re.rights_holder_id,
    CAST(EXTRACT(YEAR FROM COALESCE(sp.created_at, csr.created_at, CURRENT_DATE)) AS NUMERIC) as year,
    CAST(EXTRACT(MONTH FROM COALESCE(sp.created_at, csr.created_at, CURRENT_DATE)) AS NUMERIC) as month,
    CAST(COUNT(DISTINCT sp.id) + COUNT(DISTINCT csr.id) AS BIGINT) as transaction_count,
    CAST(COALESCE(SUM(sp.final_amount), 0) + COALESCE(SUM(csr.final_amount), 0) AS NUMERIC) as total_gross_revenue,
    CAST(COALESCE(SUM(sp.final_amount), 0) + COALESCE(SUM(csr.final_amount), 0) AS NUMERIC) as total_net_revenue,
    CAST(0 AS NUMERIC) as license_fee_revenue,
    CAST(COALESCE(SUM(sp.final_amount), 0) AS NUMERIC) as sync_proposal_revenue,
    CAST(COALESCE(SUM(csr.final_amount), 0) AS NUMERIC) as custom_sync_revenue,
    CAST(0 AS NUMERIC) as royalty_payment_revenue,
    CAST(0 AS NUMERIC) as advance_payment_revenue,
    CAST(COUNT(DISTINCT CASE WHEN sp.payment_status = 'paid' THEN sp.id END) + 
         COUNT(DISTINCT CASE WHEN csr.payment_status = 'paid' THEN csr.id END) AS BIGINT) as paid_transactions,
    CAST(COUNT(DISTINCT CASE WHEN sp.payment_status = 'pending' THEN sp.id END) + 
         COUNT(DISTINCT CASE WHEN csr.payment_status = 'pending' THEN csr.id END) AS BIGINT) as pending_transactions,
    CAST(COALESCE(SUM(CASE WHEN sp.payment_status = 'paid' THEN sp.final_amount ELSE 0 END), 0) + 
         COALESCE(SUM(CASE WHEN csr.payment_status = 'paid' THEN csr.final_amount ELSE 0 END), 0) AS NUMERIC) as paid_amount,
    CAST(COALESCE(SUM(CASE WHEN sp.payment_status = 'pending' THEN sp.final_amount ELSE 0 END), 0) + 
         COALESCE(SUM(CASE WHEN csr.payment_status = 'pending' THEN csr.final_amount ELSE 0 END), 0) AS NUMERIC) as pending_amount
FROM roster_entities re
LEFT JOIN tracks t ON t.roster_entity_id = re.id
LEFT JOIN sync_proposals sp ON sp.track_id = t.id AND sp.status = 'accepted'
LEFT JOIN custom_sync_requests csr ON csr.selected_rights_holder_id = re.rights_holder_id AND csr.status = 'completed'
WHERE re.is_active = true
GROUP BY re.id, re.name, re.entity_type, re.rights_holder_id, 
         EXTRACT(YEAR FROM COALESCE(sp.created_at, csr.created_at, CURRENT_DATE)), 
         EXTRACT(MONTH FROM COALESCE(sp.created_at, csr.created_at, CURRENT_DATE))
ORDER BY re.name, year DESC, month DESC;

-- Year-to-date summary view per roster entity
CREATE OR REPLACE VIEW roster_ytd_analytics AS
SELECT 
    re.id as roster_entity_id,
    re.name as entity_name,
    re.entity_type,
    re.rights_holder_id,
    CAST(EXTRACT(YEAR FROM CURRENT_DATE) AS NUMERIC) as current_year,
    CAST(COUNT(DISTINCT sp.id) + COUNT(DISTINCT csr.id) AS BIGINT) as total_transactions_ytd,
    CAST(COALESCE(SUM(sp.final_amount), 0) + COALESCE(SUM(csr.final_amount), 0) AS NUMERIC) as total_gross_revenue_ytd,
    CAST(COALESCE(SUM(sp.final_amount), 0) + COALESCE(SUM(csr.final_amount), 0) AS NUMERIC) as total_net_revenue_ytd,
    CAST(0 AS NUMERIC) as license_fee_revenue_ytd,
    CAST(COALESCE(SUM(sp.final_amount), 0) AS NUMERIC) as sync_proposal_revenue_ytd,
    CAST(COALESCE(SUM(csr.final_amount), 0) AS NUMERIC) as custom_sync_revenue_ytd,
    CAST(0 AS NUMERIC) as royalty_payment_revenue_ytd,
    CAST(0 AS NUMERIC) as advance_payment_revenue_ytd,
    CAST(COUNT(DISTINCT CASE WHEN sp.payment_status = 'paid' THEN sp.id END) + 
         COUNT(DISTINCT CASE WHEN csr.payment_status = 'paid' THEN csr.id END) AS BIGINT) as paid_transactions_ytd,
    CAST(COALESCE(SUM(CASE WHEN sp.payment_status = 'paid' THEN sp.final_amount ELSE 0 END), 0) + 
         COALESCE(SUM(CASE WHEN csr.payment_status = 'paid' THEN csr.final_amount ELSE 0 END), 0) AS NUMERIC) as paid_amount_ytd,
    CAST(COALESCE(SUM(CASE WHEN sp.payment_status = 'pending' THEN sp.final_amount ELSE 0 END), 0) + 
         COALESCE(SUM(CASE WHEN csr.payment_status = 'pending' THEN csr.final_amount ELSE 0 END), 0) AS NUMERIC) as pending_amount_ytd
FROM roster_entities re
LEFT JOIN tracks t ON t.roster_entity_id = re.id
LEFT JOIN sync_proposals sp ON sp.track_id = t.id AND sp.status = 'accepted' 
    AND EXTRACT(YEAR FROM sp.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
LEFT JOIN custom_sync_requests csr ON csr.selected_rights_holder_id = re.rights_holder_id 
    AND csr.status = 'completed' 
    AND EXTRACT(YEAR FROM csr.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE re.is_active = true
GROUP BY re.id, re.name, re.entity_type, re.rights_holder_id
ORDER BY total_net_revenue_ytd DESC;

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
