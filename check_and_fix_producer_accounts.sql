-- Check and Fix Producer Account Types
-- Run this in your Supabase SQL Editor

-- 1. Check all account types in the database
SELECT 
    account_type,
    COUNT(*) as count
FROM profiles
GROUP BY account_type
ORDER BY count DESC;

-- 2. Check for users with producer transactions
SELECT DISTINCT
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.account_type,
    COUNT(pt.id) as transaction_count
FROM profiles p
JOIN producer_transactions pt ON pt.transaction_producer_id = p.id
GROUP BY p.id, p.first_name, p.last_name, p.email, p.account_type
ORDER BY transaction_count DESC;

-- 3. Check for users with producer balances
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
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 4. Check for users with tracks
SELECT DISTINCT
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.account_type,
    COUNT(t.id) as track_count
FROM profiles p
JOIN tracks t ON t.track_producer_id = p.id
GROUP BY p.id, p.first_name, p.last_name, p.email, p.account_type
ORDER BY track_count DESC;

-- 5. Update account types for users who should be producers
-- (This will update users who have transactions, balances, or tracks)
UPDATE profiles 
SET account_type = 'producer'
WHERE id IN (
    -- Users with producer transactions
    SELECT DISTINCT p.id
    FROM profiles p
    JOIN producer_transactions pt ON pt.transaction_producer_id = p.id
    WHERE p.account_type != 'producer'
    
    UNION
    
    -- Users with producer balances
    SELECT DISTINCT p.id
    FROM profiles p
    JOIN producer_balances pb ON pb.balance_producer_id = p.id
    WHERE p.account_type != 'producer'
    
    UNION
    
    -- Users with tracks
    SELECT DISTINCT p.id
    FROM profiles p
    JOIN tracks t ON t.track_producer_id = p.id
    WHERE p.account_type != 'producer'
);

-- 6. Verify the changes
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

-- 8. Show updated producer list
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
WHERE p.account_type = 'producer'
ORDER BY pb.lifetime_earnings DESC NULLS LAST; 