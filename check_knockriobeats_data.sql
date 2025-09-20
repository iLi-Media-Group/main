-- Check knockriobeats@gmail.com Account Data
-- This will help us understand why pending balance ($5939) doesn't match transaction total ($9229)

-- 1. Check balance data for knockriobeats@gmail.com
SELECT 
    'knockriobeats Balance Data' as section,
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
    p.account_type,
    pb.pending_balance,
    pb.available_balance,
    pb.lifetime_earnings,
    (pb.pending_balance + pb.available_balance) as total_balance
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.email = 'knockriobeats@gmail.com';

-- 2. Check all transactions for knockriobeats@gmail.com
SELECT 
    'knockriobeats Transactions' as section,
    pt.id,
    pt.transaction_producer_id,
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
        THEN 'Current Month (Should be Pending)'
        ELSE 'Previous Months (Should be Available)'
    END as month_category
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.email = 'knockriobeats@gmail.com'
ORDER BY pt.created_at DESC;

-- 3. Check transaction totals by status
SELECT 
    'knockriobeats Transaction Totals by Status' as section,
    pt.status,
    pt.type,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.email = 'knockriobeats@gmail.com'
GROUP BY pt.status, pt.type
ORDER BY pt.status, pt.type;

-- 4. Check transaction totals by month
SELECT 
    'knockriobeats Transaction Totals by Month' as section,
    DATE_TRUNC('month', pt.created_at) as month,
    pt.status,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount,
    CASE 
        WHEN DATE_TRUNC('month', pt.created_at) >= DATE_TRUNC('month', CURRENT_DATE) 
         AND DATE_TRUNC('month', pt.created_at) < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        THEN 'Current Month (Should be Pending)'
        ELSE 'Previous Months (Should be Available)'
    END as month_category
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.email = 'knockriobeats@gmail.com'
GROUP BY DATE_TRUNC('month', pt.created_at), pt.status
ORDER BY month DESC, pt.status;

-- 5. Calculate what the pending balance SHOULD be (current month only)
SELECT 
    'knockriobeats Pending Balance Calculation' as section,
    'Current Month Pending Transactions' as metric,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount,
    'This should match the pending balance' as note
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.email = 'knockriobeats@gmail.com'
  AND pt.type = 'sale'
  AND pt.status = 'pending'
  AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'

UNION ALL

SELECT 
    'knockriobeats Pending Balance Calculation' as section,
    'All Pending Transactions' as metric,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount,
    'This is what you see as transaction total' as note
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.email = 'knockriobeats@gmail.com'
  AND pt.type = 'sale'
  AND pt.status = 'pending';

-- 6. Check if there are any transactions that should be in pending but aren't
SELECT 
    'knockriobeats Current Month Transactions' as section,
    pt.id,
    pt.amount,
    pt.type,
    pt.status,
    pt.description,
    pt.created_at,
    CASE 
        WHEN pt.created_at >= DATE_TRUNC('month', CURRENT_DATE) 
         AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        THEN 'Should be in pending balance'
        ELSE 'Should NOT be in pending balance'
    END as pending_eligibility
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.email = 'knockriobeats@gmail.com'
  AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
ORDER BY pt.created_at DESC;

-- 7. Show the discrepancy
SELECT 
    'knockriobeats Discrepancy Analysis' as section,
    'Stored Pending Balance' as field,
    pb.pending_balance as value
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.email = 'knockriobeats@gmail.com'

UNION ALL

SELECT 
    'knockriobeats Discrepancy Analysis' as section,
    'Calculated Pending Balance (Current Month)' as field,
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
    'knockriobeats Discrepancy Analysis' as section,
    'Total Pending Transactions (All Time)' as field,
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
    'knockriobeats Discrepancy Analysis' as section,
    'Difference' as field,
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
