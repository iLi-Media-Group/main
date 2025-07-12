-- Fix Hybrid Admin/Producer Account and Other Producers
-- Run this in your Supabase SQL Editor

-- 1. First, let's see the current state
SELECT 
    account_type,
    COUNT(*) as count
FROM profiles
GROUP BY account_type
ORDER BY count DESC;

-- 2. Check for users with producer transactions (excluding admin accounts)
SELECT DISTINCT
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.account_type,
    COUNT(pt.id) as transaction_count
FROM profiles p
JOIN producer_transactions pt ON pt.transaction_producer_id = p.id
WHERE p.account_type != 'admin'  -- Exclude admin accounts
GROUP BY p.id, p.first_name, p.last_name, p.email, p.account_type
ORDER BY transaction_count DESC;

-- 3. Check for users with producer balances (excluding admin accounts)
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
  AND p.account_type != 'admin'  -- Exclude admin accounts
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 4. Check for users with tracks (excluding admin accounts)
SELECT DISTINCT
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.account_type,
    COUNT(t.id) as track_count
FROM profiles p
JOIN tracks t ON t.track_producer_id = p.id
WHERE p.account_type != 'admin'  -- Exclude admin accounts
GROUP BY p.id, p.first_name, p.last_name, p.email, p.account_type
ORDER BY track_count DESC;

-- 5. Update account types for non-admin users who should be producers
UPDATE profiles 
SET account_type = 'producer'
WHERE id IN (
    -- Users with producer transactions (excluding admin)
    SELECT DISTINCT p.id
    FROM profiles p
    JOIN producer_transactions pt ON pt.transaction_producer_id = p.id
    WHERE p.account_type != 'producer' AND p.account_type != 'admin'
    
    UNION
    
    -- Users with producer balances (excluding admin)
    SELECT DISTINCT p.id
    FROM profiles p
    JOIN producer_balances pb ON pb.balance_producer_id = p.id
    WHERE p.account_type != 'producer' AND p.account_type != 'admin'
    
    UNION
    
    -- Users with tracks (excluding admin)
    SELECT DISTINCT p.id
    FROM profiles p
    JOIN tracks t ON t.track_producer_id = p.id
    WHERE p.account_type != 'producer' AND p.account_type != 'admin'
);

-- 6. Verify the changes
SELECT 
    account_type,
    COUNT(*) as count
FROM profiles
GROUP BY account_type
ORDER BY count DESC;

-- 7. Check if producers are now being counted correctly (excluding admin)
SELECT 
    'Total Producers (excluding admin)' as metric,
    COUNT(*) as value
FROM profiles p
WHERE p.account_type = 'producer'

UNION ALL

SELECT 
    'Total Admin Accounts' as metric,
    COUNT(*) as value
FROM profiles p
WHERE p.account_type = 'admin'

UNION ALL

SELECT 
    'Total Transactions' as metric,
    COUNT(*) as value
FROM producer_transactions pt
WHERE pt.type = 'sale';

-- 8. Show updated producer list (excluding admin)
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

-- 9. Show admin accounts for reference
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
WHERE p.account_type = 'admin'
ORDER BY pb.lifetime_earnings DESC NULLS LAST; 