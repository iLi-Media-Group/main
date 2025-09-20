-- Check Balance Records and Related Data
-- This will help us understand where the $5939 pending balance is coming from

-- 1. Check if there are any producer_balances records
SELECT 
    'Producer Balances' as section,
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

-- 2. Check if there are any transactions at all (any status, any type)
SELECT 
    'All Transactions (Any Status/Type)' as section,
    COUNT(*) as total_transactions,
    COUNT(DISTINCT pt.transaction_producer_id) as unique_producers,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt;

-- 3. Check if there are any transactions for producers specifically
SELECT 
    'Producer Transactions (Any Status/Type)' as section,
    COUNT(*) as total_transactions,
    COUNT(DISTINCT pt.transaction_producer_id) as unique_producers,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin');

-- 4. Check if there are any transactions with NULL producer_id
SELECT 
    'Transactions with NULL Producer ID' as section,
    COUNT(*) as count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
WHERE pt.transaction_producer_id IS NULL;

-- 5. Check if there are any transactions for non-producer accounts
SELECT 
    'Non-Producer Transactions' as section,
    p.account_type,
    COUNT(*) as count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type NOT IN ('producer', 'admin')
GROUP BY p.account_type;

-- 6. Check if there are any balance records without corresponding transactions
SELECT 
    'Balance Records Without Transactions' as section,
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
    pb.pending_balance,
    pb.available_balance,
    pb.lifetime_earnings,
    (SELECT COUNT(*) FROM producer_transactions pt WHERE pt.transaction_producer_id = p.id) as transaction_count
FROM profiles p
JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type IN ('producer', 'admin')
  AND NOT EXISTS (SELECT 1 FROM producer_transactions pt WHERE pt.transaction_producer_id = p.id);

-- 7. Check if there are any transactions without corresponding balance records
SELECT 
    'Transactions Without Balance Records' as section,
    pt.transaction_producer_id,
    p.first_name,
    p.last_name,
    p.email,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
  AND NOT EXISTS (SELECT 1 FROM producer_balances pb WHERE pb.balance_producer_id = pt.transaction_producer_id)
GROUP BY pt.transaction_producer_id, p.first_name, p.last_name, p.email;

-- 8. Show the exact amounts that might match what you're seeing
SELECT 
    'Specific Amount Check' as section,
    'Pending Balance $5939' as amount_type,
    COUNT(*) as count
FROM producer_balances
WHERE pending_balance = 5939

UNION ALL

SELECT 
    'Specific Amount Check' as section,
    'Total Balance $9229' as amount_type,
    COUNT(*) as count
FROM producer_balances
WHERE (pending_balance + available_balance) = 9229

UNION ALL

SELECT 
    'Specific Amount Check' as section,
    'Lifetime Earnings $9229' as amount_type,
    COUNT(*) as count
FROM producer_balances
WHERE lifetime_earnings = 9229;

-- 9. Check if there are any recent balance updates
SELECT 
    'Recent Balance Activity' as section,
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
    pb.pending_balance,
    pb.available_balance,
    pb.lifetime_earnings,
    pb.updated_at
FROM profiles p
JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type IN ('producer', 'admin')
  AND pb.updated_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY pb.updated_at DESC;
