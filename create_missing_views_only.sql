-- Create only the missing roster analytics views
-- This script creates the views that are causing the 400 error

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
    EXTRACT(YEAR FROM COALESCE(sp.created_at, csr.created_at, CURRENT_DATE)) as year,
    EXTRACT(MONTH FROM COALESCE(sp.created_at, csr.created_at, CURRENT_DATE)) as month,
    COUNT(DISTINCT sp.id) + COUNT(DISTINCT csr.id) as transaction_count,
    COALESCE(SUM(sp.final_amount), 0) + COALESCE(SUM(csr.final_amount), 0) as total_gross_revenue,
    COALESCE(SUM(sp.final_amount), 0) + COALESCE(SUM(csr.final_amount), 0) as total_net_revenue,
    CAST(0 AS NUMERIC) as license_fee_revenue,
    COALESCE(SUM(sp.final_amount), 0) as sync_proposal_revenue,
    COALESCE(SUM(csr.final_amount), 0) as custom_sync_revenue,
    CAST(0 AS NUMERIC) as royalty_payment_revenue,
    CAST(0 AS NUMERIC) as advance_payment_revenue,
    COUNT(DISTINCT CASE WHEN sp.payment_status = 'paid' THEN sp.id END) + 
    COUNT(DISTINCT CASE WHEN csr.payment_status = 'paid' THEN csr.id END) as paid_transactions,
    COUNT(DISTINCT CASE WHEN sp.payment_status = 'pending' THEN sp.id END) + 
    COUNT(DISTINCT CASE WHEN csr.payment_status = 'pending' THEN csr.id END) as pending_transactions,
    COALESCE(SUM(CASE WHEN sp.payment_status = 'paid' THEN sp.final_amount ELSE 0 END), 0) + 
    COALESCE(SUM(CASE WHEN csr.payment_status = 'paid' THEN csr.final_amount ELSE 0 END), 0) as paid_amount,
    COALESCE(SUM(CASE WHEN sp.payment_status = 'pending' THEN sp.final_amount ELSE 0 END), 0) + 
    COALESCE(SUM(CASE WHEN csr.payment_status = 'pending' THEN csr.final_amount ELSE 0 END), 0) as pending_amount
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
    EXTRACT(YEAR FROM CURRENT_DATE) as current_year,
    COUNT(DISTINCT sp.id) + COUNT(DISTINCT csr.id) as total_transactions_ytd,
    COALESCE(SUM(sp.final_amount), 0) + COALESCE(SUM(csr.final_amount), 0) as total_gross_revenue_ytd,
    COALESCE(SUM(sp.final_amount), 0) + COALESCE(SUM(csr.final_amount), 0) as total_net_revenue_ytd,
    CAST(0 AS NUMERIC) as license_fee_revenue_ytd,
    COALESCE(SUM(sp.final_amount), 0) as sync_proposal_revenue_ytd,
    COALESCE(SUM(csr.final_amount), 0) as custom_sync_revenue_ytd,
    CAST(0 AS NUMERIC) as royalty_payment_revenue_ytd,
    CAST(0 AS NUMERIC) as advance_payment_revenue_ytd,
    COUNT(DISTINCT CASE WHEN sp.payment_status = 'paid' THEN sp.id END) + 
    COUNT(DISTINCT CASE WHEN csr.payment_status = 'paid' THEN csr.id END) as paid_transactions_ytd,
    COALESCE(SUM(CASE WHEN sp.payment_status = 'paid' THEN sp.final_amount ELSE 0 END), 0) + 
    COALESCE(SUM(CASE WHEN csr.payment_status = 'paid' THEN csr.final_amount ELSE 0 END), 0) as paid_amount_ytd,
    COALESCE(SUM(CASE WHEN sp.payment_status = 'pending' THEN sp.final_amount ELSE 0 END), 0) + 
    COALESCE(SUM(CASE WHEN csr.payment_status = 'pending' THEN csr.final_amount ELSE 0 END), 0) as pending_amount_ytd
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
