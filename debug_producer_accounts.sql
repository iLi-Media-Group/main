-- Debug Producer Accounts
-- Run this in your Supabase SQL Editor

-- 1. Check all profiles and their account types
SELECT 
    id,
    first_name,
    last_name,
    email,
    account_type,
    created_at
FROM profiles 
ORDER BY created_at DESC;

-- 2. Check specifically for producers
SELECT 
    id,
    first_name,
    last_name,
    email,
    account_type
FROM profiles 
WHERE account_type = 'producer'
ORDER BY first_name, last_name;

-- 3. Check for any profiles that might be producers but have different account_type
SELECT 
    id,
    first_name,
    last_name,
    email,
    account_type
FROM profiles 
WHERE email LIKE '%@%' 
  AND (first_name IS NOT NULL OR last_name IS NOT NULL)
  AND account_type != 'producer'
ORDER BY account_type, first_name, last_name;

-- 4. Check producer balances table
SELECT 
    balance_producer_id,
    pending_balance,
    available_balance,
    lifetime_earnings
FROM producer_balances
ORDER BY lifetime_earnings DESC NULLS LAST;

-- 5. Check if producers have balances but wrong account_type
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

-- 6. Count by account_type
SELECT 
    account_type,
    COUNT(*) as count
FROM profiles
GROUP BY account_type
ORDER BY count DESC; 