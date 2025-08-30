-- Analyze Pending Balance Data for knockriobeats@gmail.com
-- This will show exactly what data is feeding the pending balance calculation

-- 1. Show the current month's pending transactions that SHOULD be in pending balance
SELECT 
    'Current Month Pending Transactions (Should be in Pending Balance)' as section,
    pt.id,
    pt.amount,
    pt.type,
    pt.status,
    pt.description,
    pt.track_title,
    pt.reference_id,
    pt.created_at,
    DATE_TRUNC('month', pt.created_at) as transaction_month,
    'Current Month - Should be Pending' as category
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.email = 'knockriobeats@gmail.com'
  AND pt.type = 'sale'
  AND pt.status = 'pending'
  AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
ORDER BY pt.created_at DESC;

-- 2. Show ALL pending transactions (this is what you see as transaction total)
SELECT 
    'All Pending Transactions (What you see as Transaction Total)' as section,
    pt.id,
    pt.amount,
    pt.type,
    pt.status,
    pt.description,
    pt.track_title,
    pt.reference_id,
    pt.created_at,
    DATE_TRUNC('month', pt.created_at) as transaction_month,
    CASE 
        WHEN pt.created_at >= DATE_TRUNC('month', CURRENT_DATE) 
         AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        THEN 'Current Month - Should be Pending'
        ELSE 'Previous Months - Should be Available'
    END as category
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.email = 'knockriobeats@gmail.com'
  AND pt.type = 'sale'
  AND pt.status = 'pending'
ORDER BY pt.created_at DESC;

-- 3. Show the recalculate_pending_balance function logic
SELECT 
    'Pending Balance Function Logic' as section,
    'Current Month Filter' as filter_type,
    'pt.created_at >= DATE_TRUNC(''month'', CURRENT_DATE)' as start_condition,
    'pt.created_at < DATE_TRUNC(''month'', CURRENT_DATE) + INTERVAL ''1 month''' as end_condition,
    'pt.type = ''sale'' AND pt.status = ''pending''' as transaction_conditions;

-- 4. Show what the recalculate_pending_balance function would return
SELECT 
    'Recalculate Pending Balance Function Output' as section,
    'Current Month Pending Sales' as calculation_type,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount,
    'This is what pending_balance should be' as note
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.email = 'knockriobeats@gmail.com'
  AND pt.type = 'sale'
  AND pt.status = 'pending'
  AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- 5. Show the current stored pending balance
SELECT 
    'Current Stored Pending Balance' as section,
    p.email,
    pb.pending_balance as stored_value,
    pb.updated_at as last_updated
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.email = 'knockriobeats@gmail.com';

-- 6. Show the difference and what needs to be fixed
SELECT 
    'Pending Balance Analysis' as section,
    'Stored Pending Balance' as metric,
    pb.pending_balance as value
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.email = 'knockriobeats@gmail.com'

UNION ALL

SELECT 
    'Pending Balance Analysis' as section,
    'Calculated Pending Balance (Current Month)' as metric,
    COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        JOIN profiles p2 ON p2.id = pt.transaction_producer_id
        WHERE p2.email = 'knockriobeats@gmail.com'
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0) as value

UNION ALL

SELECT 
    'Pending Balance Analysis' as section,
    'All Pending Transactions Total' as metric,
    COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        JOIN profiles p2 ON p2.id = pt.transaction_producer_id
        WHERE p2.email = 'knockriobeats@gmail.com'
          AND pt.type = 'sale'
          AND pt.status = 'pending'
    ), 0) as value

UNION ALL

SELECT 
    'Pending Balance Analysis' as section,
    'Discrepancy (Stored vs Calculated)' as metric,
    (pb.pending_balance - COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        JOIN profiles p2 ON p2.id = pt.transaction_producer_id
        WHERE p2.email = 'knockriobeats@gmail.com'
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0)) as value
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.email = 'knockriobeats@gmail.com';

-- 7. Show what transactions are in previous months that should be in available_balance
SELECT 
    'Previous Months Pending Transactions (Should be in Available Balance)' as section,
    pt.id,
    pt.amount,
    pt.type,
    pt.status,
    pt.description,
    pt.track_title,
    pt.reference_id,
    pt.created_at,
    DATE_TRUNC('month', pt.created_at) as transaction_month,
    'Previous Months - Should be Available' as category
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.email = 'knockriobeats@gmail.com'
  AND pt.type = 'sale'
  AND pt.status = 'pending'
  AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE)
ORDER BY pt.created_at DESC;
