-- Simple Balance Check for knockriobeats@gmail.com

-- 1. Check current balance
SELECT 
    'Current Balance State' as section,
    p.email,
    pb.pending_balance,
    pb.available_balance,
    pb.lifetime_earnings
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.email = 'knockriobeats@gmail.com';

-- 2. Check if producer_balances record exists
SELECT 
    'Balance Record Check' as section,
    COUNT(*) as balance_records_exist
FROM producer_balances pb
JOIN profiles p ON p.id = pb.balance_producer_id
WHERE p.email = 'knockriobeats@gmail.com';

-- 3. Check producer ID
SELECT 
    'Producer ID Check' as section,
    p.id as producer_id,
    p.email
FROM profiles p
WHERE p.email = 'knockriobeats@gmail.com';

-- 4. Manual UPDATE test
UPDATE producer_balances 
SET pending_balance = 9229.00
WHERE balance_producer_id = (
    SELECT id FROM profiles WHERE email = 'knockriobeats@gmail.com'
);

-- 5. Check after UPDATE
SELECT 
    'After Manual Update' as section,
    p.email,
    pb.pending_balance,
    pb.available_balance,
    pb.lifetime_earnings
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.email = 'knockriobeats@gmail.com';
