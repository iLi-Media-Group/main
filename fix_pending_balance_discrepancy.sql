-- Fix Pending Balance Discrepancy
-- This script will correct the pending balance to only include current month transactions
-- and ensure the balance matches the transaction total

-- 1. First, let's see what we're fixing
SELECT 
    'Before Fix' as status,
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
    pb.pending_balance as current_pending_balance,
    COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = p.id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0) as should_be_pending_balance,
    (pb.pending_balance - COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = p.id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0)) as discrepancy
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type IN ('producer', 'admin')
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 2. Update pending balance to only include current month transactions
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

-- 3. Update available balance to include previous months' pending transactions
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

-- 4. Verify the fix
SELECT 
    'After Fix' as status,
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
    pb.pending_balance as new_pending_balance,
    pb.available_balance as new_available_balance,
    pb.lifetime_earnings as lifetime_earnings,
    (pb.pending_balance + pb.available_balance) as total_balance,
    COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = p.id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0) as verified_pending_balance,
    CASE 
        WHEN pb.pending_balance = COALESCE((
            SELECT SUM(pt.amount)
            FROM producer_transactions pt
            WHERE pt.transaction_producer_id = p.id
              AND pt.type = 'sale'
              AND pt.status = 'pending'
              AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
              AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        ), 0) THEN 'MATCH'
        ELSE 'MISMATCH'
    END as pending_balance_status
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type IN ('producer', 'admin')
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 5. Show transaction breakdown by month for verification
SELECT 
    'Transaction Breakdown by Month' as section,
    DATE_TRUNC('month', pt.created_at) as month,
    pt.status,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount,
    CASE 
        WHEN pt.created_at >= DATE_TRUNC('month', CURRENT_DATE) 
         AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        THEN 'Current Month (Pending)'
        ELSE 'Previous Months (Available)'
    END as balance_category
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
  AND pt.type = 'sale'
  AND pt.status = 'pending'
GROUP BY DATE_TRUNC('month', pt.created_at), pt.status
ORDER BY month DESC;

-- 6. Show summary of the fix
SELECT 
    'Fix Summary' as section,
    'Total Pending Balance (Current Month Only)' as metric,
    SUM(pb.pending_balance) as total_amount
FROM producer_balances pb
JOIN profiles p ON p.id = pb.balance_producer_id
WHERE p.account_type IN ('producer', 'admin')

UNION ALL

SELECT 
    'Fix Summary' as section,
    'Total Available Balance (Previous Months)' as metric,
    SUM(pb.available_balance) as total_amount
FROM producer_balances pb
JOIN profiles p ON p.id = pb.balance_producer_id
WHERE p.account_type IN ('producer', 'admin')

UNION ALL

SELECT 
    'Fix Summary' as section,
    'Total Balance (Pending + Available)' as metric,
    SUM(pb.pending_balance + pb.available_balance) as total_amount
FROM producer_balances pb
JOIN profiles p ON p.id = pb.balance_producer_id
WHERE p.account_type IN ('producer', 'admin')

UNION ALL

SELECT 
    'Fix Summary' as section,
    'Total Pending Transactions (All Time)' as metric,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
  AND pt.type = 'sale'
  AND pt.status = 'pending';

-- 7. Final verification - ensure totals match
SELECT 
    'Final Verification' as section,
    'Balance Total' as source,
    SUM(pb.pending_balance + pb.available_balance) as total
FROM producer_balances pb
JOIN profiles p ON p.id = pb.balance_producer_id
WHERE p.account_type IN ('producer', 'admin')

UNION ALL

SELECT 
    'Final Verification' as section,
    'Transaction Total' as source,
    SUM(pt.amount) as total
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
  AND pt.type = 'sale'
  AND pt.status = 'pending';
