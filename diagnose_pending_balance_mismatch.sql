-- Diagnose Pending Balance vs Transaction History Mismatch
-- Run this in your Supabase SQL Editor

-- 1. Show current balance data for all producers
SELECT 
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
    p.account_type,
    pb.pending_balance as stored_pending_balance,
    pb.available_balance as stored_available_balance,
    pb.lifetime_earnings as stored_lifetime_earnings
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type IN ('producer', 'admin')
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 2. Calculate what pending balance should be from transactions
SELECT 
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
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
    COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = p.id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE)
    ), 0) as calculated_available_balance
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type IN ('producer', 'admin')
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 3. Show all pending transactions with their dates
SELECT 
    pt.id,
    pt.transaction_producer_id,
    p.first_name,
    p.last_name,
    pt.type,
    pt.amount,
    pt.status,
    pt.description,
    pt.created_at,
    CASE 
        WHEN pt.created_at >= DATE_TRUNC('month', CURRENT_DATE) 
         AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        THEN 'Current Month'
        ELSE 'Other Month'
    END as month_period
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE pt.type = 'sale' 
  AND pt.status = 'pending'
  AND p.account_type IN ('producer', 'admin')
ORDER BY pt.created_at DESC;

-- 4. Show breakdown of pending transactions by month
SELECT 
    DATE_TRUNC('month', pt.created_at) as month,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE pt.type = 'sale' 
  AND pt.status = 'pending'
  AND p.account_type IN ('producer', 'admin')
GROUP BY DATE_TRUNC('month', pt.created_at)
ORDER BY month DESC;

-- 5. Show current month date range
SELECT 
    'Current Month Start' as period,
    DATE_TRUNC('month', CURRENT_DATE) as date

UNION ALL

SELECT 
    'Current Month End' as period,
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day' as date

UNION ALL

SELECT 
    'Current Date' as period,
    CURRENT_DATE as date;

-- 6. Show specific producer with mismatch (if any)
SELECT 
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
    pb.pending_balance as stored_pending,
    COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = p.id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0) as calculated_pending,
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
  AND ABS(pb.pending_balance - COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = p.id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0)) > 0.01
ORDER BY ABS(pb.pending_balance - COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = p.id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0)) DESC;
