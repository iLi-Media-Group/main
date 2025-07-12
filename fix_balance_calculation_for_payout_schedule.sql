-- Fix Balance Calculation for Payout Schedule
-- Payout on 10th of month, so:
-- Pending = Current month transactions (held for safety)
-- Available = Previous months transactions (ready for payout)

-- Run this in your Supabase SQL Editor

-- 1. Show current month date range
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

-- 2. Show transaction breakdown by month
SELECT 
    DATE_TRUNC('month', pt.created_at) as month,
    pt.status,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
WHERE pt.type = 'sale'
GROUP BY DATE_TRUNC('month', pt.created_at), pt.status
ORDER BY month DESC, pt.status;

-- 3. Calculate correct pending balance (current month only)
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

-- 4. Calculate correct available balance (previous months only)
SELECT 
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
    p.account_type,
    pb.available_balance as old_available_balance,
    COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = p.id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE)
    ), 0) as new_available_balance
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type IN ('producer', 'admin')
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 5. Update pending balance (current month only)
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

-- 6. Update available balance (previous months only)
UPDATE producer_balances 
SET 
    available_balance = COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = producer_balances.balance_producer_id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE)
    ), 0);

-- 7. Verify the updated balances
SELECT 
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
WHERE p.account_type IN ('producer', 'admin')
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 8. Show detailed breakdown for verification
SELECT 
    'Current Month Pending' as category,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
WHERE pt.type = 'sale' 
  AND pt.status = 'pending'
  AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'

UNION ALL

SELECT 
    'Previous Months Available' as category,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
WHERE pt.type = 'sale' 
  AND pt.status = 'pending'
  AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE)

UNION ALL

SELECT 
    'All Pending Transactions' as category,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
WHERE pt.type = 'sale' 
  AND pt.status = 'pending';

-- 9. Show next payout date calculation
SELECT 
    'Next Payout Date' as info,
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + INTERVAL '9 days' as payout_date

UNION ALL

SELECT 
    'Days Until Payout' as info,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + INTERVAL '9 days' - CURRENT_DATE)::integer as days_remaining; 