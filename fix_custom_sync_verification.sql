-- Verification Script for Custom Sync Request Fixes
-- Run this in your Supabase SQL Editor to verify the fixes

-- Check 1: Verify all paid custom sync requests have selected_producer_id
SELECT 'Check 1: Paid custom sync requests with selected_producer_id' as check_type;
SELECT 
    COUNT(*) as total_paid_requests,
    COUNT(CASE WHEN selected_producer_id IS NOT NULL THEN 1 END) as with_selected_producer,
    COUNT(CASE WHEN selected_producer_id IS NULL THEN 1 END) as missing_selected_producer
FROM custom_sync_requests 
WHERE payment_status = 'paid';

-- Check 2: Show any remaining issues
SELECT 'Check 2: Any remaining paid requests without selected_producer_id' as check_type;
SELECT 
    id,
    project_title,
    sync_fee,
    final_amount,
    payment_status,
    selected_producer_id,
    created_at,
    updated_at
FROM custom_sync_requests 
WHERE payment_status = 'paid' AND selected_producer_id IS NULL;

-- Check 3: Verify transaction records exist for all paid custom sync requests
SELECT 'Check 3: Custom sync requests with transaction records' as check_type;
SELECT 
    COUNT(*) as total_paid_requests,
    COUNT(CASE WHEN pt.id IS NOT NULL THEN 1 END) as with_transactions,
    COUNT(CASE WHEN pt.id IS NULL THEN 1 END) as missing_transactions
FROM custom_sync_requests csr
LEFT JOIN producer_transactions pt ON csr.id::text = pt.reference_id
WHERE csr.payment_status = 'paid' AND csr.selected_producer_id IS NOT NULL;

-- Check 4: Show any missing transaction records
SELECT 'Check 4: Paid custom sync requests missing transaction records' as check_type;
SELECT 
    csr.id,
    csr.project_title,
    csr.selected_producer_id,
    csr.sync_fee,
    csr.final_amount,
    csr.payment_status,
    p.first_name,
    p.last_name,
    p.email
FROM custom_sync_requests csr
LEFT JOIN producer_transactions pt ON csr.id::text = pt.reference_id
LEFT JOIN profiles p ON csr.selected_producer_id = p.id
WHERE csr.payment_status = 'paid' 
  AND csr.selected_producer_id IS NOT NULL
  AND pt.id IS NULL;

-- Check 5: Verify producer balances include custom sync revenue
SELECT 'Check 5: Producer balances with custom sync revenue' as check_type;
SELECT 
    pb.balance_producer_id,
    p.first_name,
    p.last_name,
    p.email,
    pb.pending_balance,
    pb.available_balance,
    pb.lifetime_earnings,
    COUNT(csr.id) as custom_sync_count,
    SUM(COALESCE(csr.final_amount, csr.sync_fee) * 0.70) as expected_custom_sync_revenue
FROM producer_balances pb
JOIN profiles p ON pb.balance_producer_id = p.id
LEFT JOIN custom_sync_requests csr ON pb.balance_producer_id = csr.selected_producer_id 
  AND csr.payment_status = 'paid'
GROUP BY pb.balance_producer_id, p.first_name, p.last_name, p.email, pb.pending_balance, pb.available_balance, pb.lifetime_earnings
HAVING COUNT(csr.id) > 0
ORDER BY pb.lifetime_earnings DESC;

-- Check 6: Summary of all custom sync requests
SELECT 'Check 6: Summary of all custom sync requests' as check_type;
SELECT 
    status,
    payment_status,
    COUNT(*) as count,
    AVG(sync_fee) as avg_sync_fee,
    SUM(CASE WHEN payment_status = 'paid' THEN COALESCE(final_amount, sync_fee) ELSE 0 END) as total_paid_amount
FROM custom_sync_requests 
GROUP BY status, payment_status
ORDER BY status, payment_status;

-- Check 7: Verify triggers are working
SELECT 'Check 7: Verify triggers exist' as check_type;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN (
    'trigger_ensure_custom_sync_selected_producer',
    'trigger_sync_custom_sync_to_transactions'
)
AND event_object_table = 'custom_sync_requests';

-- Check 8: Verify functions exist
SELECT 'Check 8: Verify functions exist' as check_type;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN (
    'ensure_custom_sync_selected_producer',
    'sync_custom_sync_to_transactions'
);

-- Final summary
SELECT 'FIXES VERIFICATION COMPLETE' as status;
