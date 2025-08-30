-- Clear Browser Cache and Refresh Data
-- This script will help ensure the Producer Banking page shows correct data

-- 1. First, let's verify the current state of the database
SELECT 
    'Current Database State' as section,
    'Total Producer Balances' as metric,
    COUNT(*) as count
FROM producer_balances pb
JOIN profiles p ON p.id = pb.balance_producer_id
WHERE p.account_type IN ('producer', 'admin')

UNION ALL

SELECT 
    'Current Database State' as section,
    'Total Producer Transactions' as metric,
    COUNT(*) as count
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')

UNION ALL

SELECT 
    'Current Database State' as section,
    'Total Pending Transactions' as metric,
    COUNT(*) as count
FROM producer_transactions pt
JOIN profiles p ON p.id = pt.transaction_producer_id
WHERE p.account_type IN ('producer', 'admin')
  AND pt.type = 'sale'
  AND pt.status = 'pending';

-- 2. Show the exact data that should be displayed for your account
SELECT 
    'Your Account Data' as section,
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
    p.account_type,
    pb.pending_balance,
    pb.available_balance,
    pb.lifetime_earnings,
    (pb.pending_balance + pb.available_balance) as total_balance,
    (SELECT COUNT(*) FROM producer_transactions pt WHERE pt.transaction_producer_id = p.id) as transaction_count,
    (SELECT SUM(pt.amount) FROM producer_transactions pt WHERE pt.transaction_producer_id = p.id) as transaction_total
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.email = 'babyimmastarrecords@gmail.com';

-- 3. Instructions for clearing browser cache
SELECT 
    'Browser Cache Instructions' as section,
    'Step 1: Hard Refresh' as step,
    'Press Ctrl+F5 (Windows) or Cmd+Shift+R (Mac) to force refresh the page' as instruction

UNION ALL

SELECT 
    'Browser Cache Instructions' as section,
    'Step 2: Clear Browser Cache' as step,
    'Open Developer Tools (F12), right-click refresh button, select "Empty Cache and Hard Reload"' as instruction

UNION ALL

SELECT 
    'Browser Cache Instructions' as section,
    'Step 3: Check Network Tab' as step,
    'In Developer Tools > Network tab, check if API calls are returning correct data' as instruction

UNION ALL

SELECT 
    'Browser Cache Instructions' as section,
    'Step 4: Verify Data Source' as step,
    'Check if the page is making correct API calls to fetch producer balance and transactions' as instruction;

-- 4. Show what the Producer Banking page should display
SELECT 
    'Expected Producer Banking Page Display' as section,
    'Pending Balance' as field,
    COALESCE(pb.pending_balance, 0) as value,
    'Should show current month pending transactions only' as description
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.email = 'babyimmastarrecords@gmail.com'

UNION ALL

SELECT 
    'Expected Producer Banking Page Display' as section,
    'Available Balance' as field,
    COALESCE(pb.available_balance, 0) as value,
    'Should show previous months transactions' as description
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.email = 'babyimmastarrecords@gmail.com'

UNION ALL

SELECT 
    'Expected Producer Banking Page Display' as section,
    'Transaction Count' as field,
    (SELECT COUNT(*) FROM producer_transactions pt WHERE pt.transaction_producer_id = p.id) as value,
    'Should show total number of transactions' as description
FROM profiles p
WHERE p.email = 'babyimmastarrecords@gmail.com'

UNION ALL

SELECT 
    'Expected Producer Banking Page Display' as section,
    'Transaction Total' as field,
    COALESCE((SELECT SUM(pt.amount) FROM producer_transactions pt WHERE pt.transaction_producer_id = p.id), 0) as value,
    'Should show sum of all transaction amounts' as description
FROM profiles p
WHERE p.email = 'babyimmastarrecords@gmail.com';

-- 5. Summary of the issue
SELECT 
    'Issue Summary' as section,
    'Problem' as field,
    'Producer Banking page shows $5939 pending balance and $9229 transaction total, but database shows $0' as description

UNION ALL

SELECT 
    'Issue Summary' as section,
    'Root Cause' as field,
    'Likely browser cache or stale data being displayed instead of fresh database data' as description

UNION ALL

SELECT 
    'Issue Summary' as section,
    'Solution' as field,
    'Clear browser cache and ensure page fetches fresh data from database' as description;
