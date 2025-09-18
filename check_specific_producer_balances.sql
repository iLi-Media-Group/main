-- Check Specific Producer Balance Records
-- This will check the balance records for the specific producer accounts mentioned

-- 1. Check balance records for both producer accounts
SELECT 
    'Specific Producer Balances' as section,
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
    p.account_type,
    pb.pending_balance,
    pb.available_balance,
    pb.lifetime_earnings,
    (pb.pending_balance + pb.available_balance) as total_balance,
    pb.created_at,
    pb.updated_at
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.id IN (
    '9f8b5923-d118-43a6-8cd4-e2d9d25386d0',  -- babyimmastarrecords@gmail.com
    '83e21f94-aced-452a-bafb-6eb9629e3b18'   -- knockriobeats@gmail.com
)
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 2. Check if there are any transactions for these specific producers
SELECT 
    'Specific Producer Transactions' as section,
    pt.id,
    pt.transaction_producer_id,
    pt.amount,
    pt.type,
    pt.status,
    pt.description,
    pt.track_title,
    pt.reference_id,
    pt.created_at,
    p.email as producer_email
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE pt.transaction_producer_id IN (
    '9f8b5923-d118-43a6-8cd4-e2d9d25386d0',  -- babyimmastarrecords@gmail.com
    '83e21f94-aced-452a-bafb-6eb9629e3b18'   -- knockriobeats@gmail.com
)
ORDER BY pt.created_at DESC;

-- 3. Check transaction totals for these specific producers
SELECT 
    'Specific Producer Transaction Totals' as section,
    p.id as producer_id,
    p.email as producer_email,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount,
    SUM(CASE WHEN pt.status = 'pending' THEN pt.amount ELSE 0 END) as pending_amount,
    SUM(CASE WHEN pt.status = 'completed' THEN pt.amount ELSE 0 END) as completed_amount
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE pt.transaction_producer_id IN (
    '9f8b5923-d118-43a6-8cd4-e2d9d25386d0',  -- babyimmastarrecords@gmail.com
    '83e21f94-aced-452a-bafb-6eb9629e3b18'   -- knockriobeats@gmail.com
)
GROUP BY p.id, p.email;

-- 4. Check if there are any balance records with the specific amounts you're seeing
SELECT 
    'Balance Records with Specific Amounts' as section,
    p.id as producer_id,
    p.email as producer_email,
    pb.pending_balance,
    pb.available_balance,
    pb.lifetime_earnings,
    (pb.pending_balance + pb.available_balance) as total_balance,
    CASE 
        WHEN pb.pending_balance = 5939 THEN 'MATCHES PENDING $5939'
        WHEN (pb.pending_balance + pb.available_balance) = 9229 THEN 'MATCHES TOTAL $9229'
        WHEN pb.lifetime_earnings = 9229 THEN 'MATCHES LIFETIME $9229'
        ELSE 'NO MATCH'
    END as amount_match
FROM profiles p
JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type IN ('producer', 'admin')
  AND (pb.pending_balance = 5939 
       OR (pb.pending_balance + pb.available_balance) = 9229 
       OR pb.lifetime_earnings = 9229)
ORDER BY pb.lifetime_earnings DESC;

-- 5. Check all producer accounts to see if any have the amounts you're seeing
SELECT 
    'All Producer Balances' as section,
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

-- 6. Check if there are any transactions that sum to the amounts you're seeing
SELECT 
    'Transaction Sums Check' as section,
    pt.transaction_producer_id,
    p.email as producer_email,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount,
    CASE 
        WHEN SUM(pt.amount) = 5939 THEN 'MATCHES PENDING $5939'
        WHEN SUM(pt.amount) = 9229 THEN 'MATCHES TOTAL $9229'
        ELSE 'NO MATCH'
    END as amount_match
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
GROUP BY pt.transaction_producer_id, p.email
HAVING SUM(pt.amount) IN (5939, 9229)
ORDER BY SUM(pt.amount) DESC;
