-- Fix Pending Balance Calculation by Current Month
-- Run this in your Supabase SQL Editor

-- 1. First, let's see the current pending balance calculation
SELECT 
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
    p.account_type,
    pb.pending_balance as current_pending_balance,
    pb.available_balance,
    pb.lifetime_earnings
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type IN ('producer', 'admin')
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 2. Show current month date range
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

-- 3. Show all pending transactions with their dates
SELECT 
    pt.id,
    pt.transaction_producer_id,
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
WHERE pt.type = 'sale' 
  AND pt.status = 'pending'
ORDER BY pt.created_at DESC;

-- 4. Calculate correct pending balance for current month only
SELECT 
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
    p.account_type,
    pb.pending_balance as old_pending_balance,
    COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = p.id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0) as new_pending_balance
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type IN ('producer', 'admin')
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 5. Update pending balance to only include current month transactions
UPDATE producer_balances 
SET 
    pending_balance = COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = producer_balances.balance_producer_id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0);

-- 6. Verify the updated pending balances
SELECT 
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
    p.account_type,
    pb.pending_balance,
    pb.available_balance,
    pb.lifetime_earnings
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type IN ('producer', 'admin')
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 7. Show breakdown of pending transactions by month
SELECT 
    DATE_TRUNC('month', pt.created_at) as month,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
WHERE pt.type = 'sale' 
  AND pt.status = 'pending'
GROUP BY DATE_TRUNC('month', pt.created_at)
ORDER BY month DESC;

-- 8. Show current month pending transactions only
SELECT 
    pt.id,
    pt.transaction_producer_id,
    pt.type,
    pt.amount,
    pt.status,
    pt.description,
    pt.created_at
FROM producer_transactions pt
WHERE pt.type = 'sale' 
  AND pt.status = 'pending'
  AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
ORDER BY pt.created_at DESC; 