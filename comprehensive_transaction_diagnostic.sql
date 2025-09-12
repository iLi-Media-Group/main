-- Comprehensive Transaction Diagnostic
-- This will show us exactly what's in the database and why there's a mismatch

-- 1. Show ALL transactions regardless of status
SELECT 
    'All Transactions (Any Status)' as section,
    pt.id,
    pt.transaction_producer_id,
    pt.amount,
    pt.type,
    pt.status,
    pt.description,
    pt.track_title,
    pt.reference_id,
    pt.created_at,
    DATE_TRUNC('month', pt.created_at) as transaction_month
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
ORDER BY pt.created_at DESC;

-- 2. Show transaction counts by status
SELECT 
    'Transaction Counts by Status' as section,
    pt.status,
    pt.type,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
GROUP BY pt.status, pt.type
ORDER BY pt.status, pt.type;

-- 3. Show current balance data
SELECT 
    'Current Balance Data' as section,
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
    pb.pending_balance as stored_pending_balance,
    pb.available_balance as stored_available_balance,
    pb.lifetime_earnings as stored_lifetime_earnings,
    (pb.pending_balance + pb.available_balance) as total_stored_balance
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type IN ('producer', 'admin')
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 4. Show transactions by month and status
SELECT 
    'Transactions by Month and Status' as section,
    DATE_TRUNC('month', pt.created_at) as month,
    pt.status,
    pt.type,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
GROUP BY DATE_TRUNC('month', pt.created_at), pt.status, pt.type
ORDER BY month DESC, pt.status, pt.type;

-- 5. Show the most recent transactions
SELECT 
    'Most Recent Transactions' as section,
    pt.id,
    pt.transaction_producer_id,
    pt.amount,
    pt.type,
    pt.status,
    pt.description,
    pt.created_at
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
ORDER BY pt.created_at DESC
LIMIT 20;

-- 6. Check if there are any transactions with specific amounts that match the discrepancy
SELECT 
    'Transactions with Specific Amounts' as section,
    pt.id,
    pt.transaction_producer_id,
    pt.amount,
    pt.type,
    pt.status,
    pt.description,
    pt.created_at
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
  AND pt.amount IN (5939, 9229, 3290) -- Check for amounts that might explain the difference
ORDER BY pt.amount DESC;

-- 7. Show total of all transactions by type
SELECT 
    'Total Transactions by Type' as section,
    pt.type,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
GROUP BY pt.type
ORDER BY pt.type;

-- 8. Show if there are any transactions that might be counted differently
SELECT 
    'All Transaction Totals' as section,
    'Total All Transactions' as metric,
    COUNT(*) as count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')

UNION ALL

SELECT 
    'All Transaction Totals' as section,
    'Total Sales Transactions' as metric,
    COUNT(*) as count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
  AND pt.type = 'sale'

UNION ALL

SELECT 
    'All Transaction Totals' as section,
    'Total Pending Sales' as metric,
    COUNT(*) as count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
  AND pt.type = 'sale'
  AND pt.status = 'pending'

UNION ALL

SELECT 
    'All Transaction Totals' as section,
    'Total Completed Sales' as metric,
    COUNT(*) as count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
  AND pt.type = 'sale'
  AND pt.status = 'completed';

-- 9. Check if the Producer Banking page might be showing different data
SELECT 
    'Producer Banking Page Data Check' as section,
    'Transactions in Last 30 Days' as metric,
    COUNT(*) as count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
  AND pt.created_at >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

SELECT 
    'Producer Banking Page Data Check' as section,
    'Transactions in Last 90 Days' as metric,
    COUNT(*) as count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
  AND pt.created_at >= CURRENT_DATE - INTERVAL '90 days'

UNION ALL

SELECT 
    'Producer Banking Page Data Check' as section,
    'All Time Transactions' as metric,
    COUNT(*) as count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin');
