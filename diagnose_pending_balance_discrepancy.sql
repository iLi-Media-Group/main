-- Diagnose Pending Balance vs Transaction Total Discrepancy
-- The issue: Pending Balance shows $5939 but transactions total $9229
-- This script will identify the exact cause of the mismatch

-- 1. Show current balance data for the current user
SELECT 
    'Current Balance Data' as section,
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
    pb.pending_balance as stored_pending_balance,
    pb.available_balance as stored_available_balance,
    pb.lifetime_earnings as stored_lifetime_earnings
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type IN ('producer', 'admin')
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 2. Show ALL transactions for the current user with their dates and status
SELECT 
    'All Transactions' as section,
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
        THEN 'Current Month'
        ELSE 'Previous Months'
    END as month_category
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
ORDER BY pt.created_at DESC;

-- 3. Calculate what the pending balance SHOULD be (current month only)
SELECT 
    'Pending Balance Calculation' as section,
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
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
WHERE p.account_type IN ('producer', 'admin')
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 4. Show transaction totals by month and status
SELECT 
    'Transaction Totals by Month and Status' as section,
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

-- 5. Show current month date range for reference
SELECT 
    'Date Reference' as section,
    'Current Month Start' as period,
    DATE_TRUNC('month', CURRENT_DATE) as date

UNION ALL

SELECT 
    'Date Reference' as section,
    'Current Month End' as period,
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day' as date

UNION ALL

SELECT 
    'Date Reference' as section,
    'Current Date' as period,
    CURRENT_DATE as date;

-- 6. Show transactions that might be causing the discrepancy
SELECT 
    'Potential Discrepancy Transactions' as section,
    pt.id,
    pt.transaction_producer_id,
    pt.amount,
    pt.type,
    pt.status,
    pt.description,
    pt.created_at,
    CASE 
        WHEN pt.created_at >= DATE_TRUNC('month', CURRENT_DATE) 
         AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        THEN 'Should be in pending'
        ELSE 'Should NOT be in pending'
    END as pending_eligibility
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
  AND pt.type = 'sale'
  AND pt.status = 'pending'
ORDER BY pt.created_at DESC;

-- 7. Check if there are any transactions with NULL or invalid dates
SELECT 
    'Transactions with Date Issues' as section,
    pt.id,
    pt.transaction_producer_id,
    pt.amount,
    pt.type,
    pt.status,
    pt.created_at,
    CASE 
        WHEN pt.created_at IS NULL THEN 'NULL DATE'
        WHEN pt.created_at < '2020-01-01' THEN 'VERY OLD DATE'
        WHEN pt.created_at > CURRENT_DATE + INTERVAL '1 day' THEN 'FUTURE DATE'
        ELSE 'VALID DATE'
    END as date_status
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
  AND (pt.created_at IS NULL 
       OR pt.created_at < '2020-01-01' 
       OR pt.created_at > CURRENT_DATE + INTERVAL '1 day')
ORDER BY pt.created_at DESC;

-- 8. Show summary of the issue
SELECT 
    'Summary' as section,
    'Total Pending Transactions (All Time)' as metric,
    COUNT(*) as count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
  AND pt.type = 'sale'
  AND pt.status = 'pending'

UNION ALL

SELECT 
    'Summary' as section,
    'Current Month Pending Transactions' as metric,
    COUNT(*) as count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
  AND pt.type = 'sale'
  AND pt.status = 'pending'
  AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'

UNION ALL

SELECT 
    'Summary' as section,
    'Previous Months Pending Transactions' as metric,
    COUNT(*) as count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
  AND pt.type = 'sale'
  AND pt.status = 'pending'
  AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE);
