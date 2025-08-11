-- Check All Producer Accounts (including admin/producers)
-- This will help us understand why only one producer is showing up

-- 1. Check all profiles with their account types
SELECT 
    'All Profiles with Account Types' as section,
    p.email,
    p.id as profile_id,
    p.account_type,
    p.first_name,
    p.last_name
FROM profiles p
ORDER BY p.account_type, p.email;

-- 2. Check specifically for your admin/producer account
SELECT 
    'Your Admin/Producer Account' as section,
    p.email,
    p.id as profile_id,
    p.account_type,
    p.first_name,
    p.last_name,
    CASE 
        WHEN pb.balance_producer_id IS NOT NULL THEN 'Has Balance Record'
        ELSE 'Missing Balance Record'
    END as balance_record_status
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.email = 'knockriobeats@gmail.com' 
   OR p.id = '83e21f94-aced-452a-bafb-6eb9629e3b18';

-- 3. Check all accounts that should have producer balances
SELECT 
    'All Accounts That Should Have Producer Balances' as section,
    p.email,
    p.id as profile_id,
    p.account_type,
    CASE 
        WHEN pb.balance_producer_id IS NOT NULL THEN 'Has Balance Record'
        ELSE 'Missing Balance Record'
    END as balance_record_status,
    pb.pending_balance,
    pb.available_balance,
    pb.lifetime_earnings
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type IN ('producer', 'admin')
ORDER BY p.email;

-- 4. Check if there are any transactions for your account
SELECT 
    'Transactions for knockriobeats@gmail.com' as section,
    pt.id,
    pt.transaction_producer_id,
    pt.amount,
    pt.type,
    pt.status,
    pt.description,
    pt.created_at
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.email = 'knockriobeats@gmail.com'
ORDER BY pt.created_at DESC;

-- 5. Check if your account has the correct account_type
SELECT 
    'Account Type Check' as section,
    p.email,
    p.id as profile_id,
    p.account_type,
    CASE 
        WHEN p.account_type IN ('producer', 'admin') THEN 'Should have producer balance'
        ELSE 'Should NOT have producer balance'
    END as balance_eligibility
FROM profiles p
WHERE p.email IN ('knockriobeats@gmail.com', 'babyimmastarrecords@gmail.com')
   OR p.id IN ('83e21f94-aced-452a-bafb-6eb9629e3b18', '9f8b5923-d118-43a6-8cd4-e2d9d25386d0');

-- 6. Show all balance records
SELECT 
    'All Balance Records' as section,
    pb.balance_producer_id,
    p.email,
    p.account_type,
    pb.pending_balance,
    pb.available_balance,
    pb.lifetime_earnings
FROM producer_balances pb
JOIN profiles p ON p.id = pb.balance_producer_id
ORDER BY p.email;
