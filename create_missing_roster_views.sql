-- Create missing roster analytics views
-- This script creates only the missing views that are causing the 400 error

-- ============================================
-- 1. CREATE THE MISSING VIEWS
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

-- ============================================
-- 2. VERIFY THE VIEWS WERE CREATED
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
