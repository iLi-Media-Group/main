-- Simple view creation script with step-by-step error checking
-- This will help us identify exactly what's failing

-- ============================================
-- STEP 1: Try to create the first view
-- ============================================

-- Create monthly analytics view
CREATE OR REPLACE VIEW roster_monthly_analytics AS
SELECT 
    re.id as roster_entity_id,
    re.name as entity_name,
    re.entity_type,
    re.rights_holder_id,
    2025 as year,
    1 as month,
    0 as transaction_count,
    0.00 as total_gross_revenue,
    0.00 as total_net_revenue,
    0.00 as license_fee_revenue,
    0.00 as sync_proposal_revenue,
    0.00 as custom_sync_revenue,
    0.00 as royalty_payment_revenue,
    0.00 as advance_payment_revenue,
    0 as paid_transactions,
    0 as pending_transactions,
    0.00 as paid_amount,
    0.00 as pending_amount
FROM roster_entities re
WHERE re.is_active = true;

-- Check if it was created
SELECT 'STEP 1: roster_monthly_analytics created' as status, EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_name = 'roster_monthly_analytics'
) as exists;

-- ============================================
-- STEP 2: Try to create the second view
-- ============================================

-- Create YTD analytics view
CREATE OR REPLACE VIEW roster_ytd_analytics AS
SELECT 
    re.id as roster_entity_id,
    re.name as entity_name,
    re.entity_type,
    re.rights_holder_id,
    2025 as current_year,
    0 as total_transactions_ytd,
    0.00 as total_gross_revenue_ytd,
    0.00 as total_net_revenue_ytd,
    0.00 as license_fee_revenue_ytd,
    0.00 as sync_proposal_revenue_ytd,
    0.00 as custom_sync_revenue_ytd,
    0.00 as royalty_payment_revenue_ytd,
    0.00 as advance_payment_revenue_ytd,
    0 as paid_transactions_ytd,
    0.00 as paid_amount_ytd,
    0.00 as pending_amount_ytd
FROM roster_entities re
WHERE re.is_active = true;

-- Check if it was created
SELECT 'STEP 2: roster_ytd_analytics created' as status, EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_name = 'roster_ytd_analytics'
) as exists;

-- ============================================
-- STEP 3: Final verification
-- ============================================

-- Check all views
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
