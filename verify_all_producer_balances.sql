-- Verify All Producer Balance Calculations
-- This ensures the pending balance calculation works for ALL producers

-- 1. Check all producers and their current balance states
SELECT 
    'All Producer Balance States' as section,
    p.email,
    p.id as producer_id,
    p.account_type,
    pb.pending_balance as stored_pending_balance,
    COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = p.id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0) as calculated_pending_balance,
    CASE 
        WHEN pb.pending_balance = COALESCE((
            SELECT SUM(pt.amount)
            FROM producer_transactions pt
            WHERE pt.transaction_producer_id = p.id
              AND pt.type = 'sale'
              AND pt.status = 'pending'
              AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
              AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        ), 0) THEN '✅ MATCH'
        ELSE '❌ MISMATCH'
    END as status
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type IN ('producer', 'admin') OR p.account_type LIKE '%producer%' OR p.account_type LIKE '%admin%'
ORDER BY p.email;

-- 2. Show producers with mismatched balances
SELECT 
    'Producers with Balance Mismatches' as section,
    p.email,
    p.id as producer_id,
    pb.pending_balance as stored_pending_balance,
    COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = p.id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0) as calculated_pending_balance,
    (pb.pending_balance - COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = p.id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0)) as difference
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE (p.account_type IN ('producer', 'admin') OR p.account_type LIKE '%producer%' OR p.account_type LIKE '%admin%')
  AND pb.pending_balance != COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = p.id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0)
ORDER BY ABS(pb.pending_balance - COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = p.id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0)) DESC;

-- 3. Verify the trigger function exists and is working
SELECT 
    'Trigger Function Status' as section,
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'trigger_recalculate_pending_balance'
  AND routine_schema = 'public';

-- 4. Verify the trigger is attached to the correct table
SELECT 
    'Trigger Attachment Status' as section,
    trigger_name,
    event_object_table,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_recalculate_pending_balance_on_transactions'
  AND event_object_schema = 'public';

-- 5. Test the recalculate_all_pending_balances function
SELECT 
    'Testing recalculate_all_pending_balances function' as section,
    'This will update all producer balances to match calculated values' as note;

-- Call the function to fix all balances
SELECT recalculate_all_pending_balances();

-- 6. Verify the fix worked for all producers
SELECT 
    'After Fix - All Producer Balance States' as section,
    p.email,
    p.id as producer_id,
    pb.pending_balance as stored_pending_balance,
    COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = p.id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0) as calculated_pending_balance,
    CASE 
        WHEN pb.pending_balance = COALESCE((
            SELECT SUM(pt.amount)
            FROM producer_transactions pt
            WHERE pt.transaction_producer_id = p.id
              AND pt.type = 'sale'
              AND pt.status = 'pending'
              AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
              AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        ), 0) THEN '✅ MATCH'
        ELSE '❌ MISMATCH'
    END as status
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type IN ('producer', 'admin') OR p.account_type LIKE '%producer%' OR p.account_type LIKE '%admin%'
ORDER BY p.email;
