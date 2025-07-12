-- Fix Producer Account Types
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what account types exist
SELECT 
    account_type,
    COUNT(*) as count
FROM profiles
GROUP BY account_type
ORDER BY count DESC;

-- 2. Find users who have producer balances but might not have account_type = 'producer'
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.account_type,
    pb.pending_balance,
    pb.available_balance,
    pb.lifetime_earnings
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE pb.balance_producer_id IS NOT NULL
  AND p.account_type != 'producer'
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 3. Find users who have producer transactions but might not have account_type = 'producer'
SELECT DISTINCT
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.account_type,
    COUNT(pt.id) as transaction_count
FROM profiles p
JOIN producer_transactions pt ON pt.transaction_producer_id = p.id
WHERE p.account_type != 'producer'
GROUP BY p.id, p.first_name, p.last_name, p.email, p.account_type
ORDER BY transaction_count DESC;

-- 4. Find users who have tracks but might not have account_type = 'producer'
SELECT DISTINCT
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.account_type,
    COUNT(t.id) as track_count
FROM profiles p
JOIN tracks t ON t.track_producer_id = p.id
WHERE p.account_type != 'producer'
GROUP BY p.id, p.first_name, p.last_name, p.email, p.account_type
ORDER BY track_count DESC;

-- 5. Update account types for users who should be producers
-- (Uncomment and modify the WHERE clause based on the results above)

/*
UPDATE profiles 
SET account_type = 'producer'
WHERE id IN (
    -- Add the IDs of users who should be producers
    -- You can get these from the queries above
    'uuid-here',
    'another-uuid-here'
);
*/

-- 6. After updating, verify the changes
SELECT 
    account_type,
    COUNT(*) as count
FROM profiles
GROUP BY account_type
ORDER BY count DESC;

-- 7. Check if producers are now being counted correctly
SELECT 
    'Total Producers' as metric,
    COUNT(*) as value
FROM profiles p
WHERE p.account_type = 'producer'

UNION ALL

SELECT 
    'Total Transactions' as metric,
    COUNT(*) as value
FROM producer_transactions pt
WHERE pt.type = 'sale'; 