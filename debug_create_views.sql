-- Debug script to create missing roster views one by one
-- This will help identify what's causing the views not to be created

-- ============================================
-- 1. CHECK WHAT TABLES EXIST FIRST
-- ============================================

-- Check if required tables exist
SELECT 'roster_entities' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'roster_entities'
) as exists;

SELECT 'tracks' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'tracks'
) as exists;

SELECT 'sync_proposals' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'sync_proposals'
) as exists;

SELECT 'custom_sync_requests' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'custom_sync_requests'
) as exists;

-- ============================================
-- 2. CREATE FIRST VIEW - MONTHLY ANALYTICS
-- ============================================

-- Try to create the monthly analytics view
CREATE OR REPLACE VIEW roster_monthly_analytics AS
SELECT 
    re.id as roster_entity_id,
    re.name as entity_name,
    re.entity_type,
    re.rights_holder_id,
    EXTRACT(YEAR FROM CURRENT_DATE) as year,
    EXTRACT(MONTH FROM CURRENT_DATE) as month,
    0 as transaction_count,
    0 as total_gross_revenue,
    0 as total_net_revenue,
    0 as license_fee_revenue,
    0 as sync_proposal_revenue,
    0 as custom_sync_revenue,
    0 as royalty_payment_revenue,
    0 as advance_payment_revenue,
    0 as paid_transactions,
    0 as pending_transactions,
    0 as paid_amount,
    0 as pending_amount
FROM roster_entities re
WHERE re.is_active = true;

-- ============================================
-- 3. CREATE SECOND VIEW - YTD ANALYTICS
-- ============================================

-- Try to create the YTD analytics view
CREATE OR REPLACE VIEW roster_ytd_analytics AS
SELECT 
    re.id as roster_entity_id,
    re.name as entity_name,
    re.entity_type,
    re.rights_holder_id,
    EXTRACT(YEAR FROM CURRENT_DATE) as current_year,
    0 as total_transactions_ytd,
    0 as total_gross_revenue_ytd,
    0 as total_net_revenue_ytd,
    0 as license_fee_revenue_ytd,
    0 as sync_proposal_revenue_ytd,
    0 as custom_sync_revenue_ytd,
    0 as royalty_payment_revenue_ytd,
    0 as advance_payment_revenue_ytd,
    0 as paid_transactions_ytd,
    0 as paid_amount_ytd,
    0 as pending_amount_ytd
FROM roster_entities re
WHERE re.is_active = true;

-- ============================================
-- 4. VERIFY ALL VIEWS WERE CREATED
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
