-- Fix knockriobeats@gmail.com Pending Balance
-- This will update the stored pending balance to match the calculated value from transactions

-- First, let's verify the current state
SELECT 
    'Before Fix - Current Balance' as section,
    p.email,
    pb.pending_balance as stored_pending_balance,
    COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        JOIN profiles p2 ON p2.id = pt.transaction_producer_id
        WHERE p2.email = 'knockriobeats@gmail.com'
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0) as calculated_pending_balance
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.email = 'knockriobeats@gmail.com';

-- Update the pending balance to match the calculated value
UPDATE producer_balances 
SET 
    pending_balance = COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        JOIN profiles p2 ON p2.id = pt.transaction_producer_id
        WHERE p2.email = 'knockriobeats@gmail.com'
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0),
    updated_at = NOW()
WHERE balance_producer_id = (
    SELECT id FROM profiles WHERE email = 'knockriobeats@gmail.com'
);

-- Verify the fix
SELECT 
    'After Fix - Updated Balance' as section,
    p.email,
    pb.pending_balance as stored_pending_balance,
    COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        JOIN profiles p2 ON p2.id = pt.transaction_producer_id
        WHERE p2.email = 'knockriobeats@gmail.com'
          AND pt.type = 'sale'
          AND pt.status = 'pending'
          AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    ), 0) as calculated_pending_balance,
    CASE 
        WHEN pb.pending_balance = COALESCE((
            SELECT SUM(pt.amount)
            FROM producer_transactions pt
            JOIN profiles p2 ON p2.id = pt.transaction_producer_id
            WHERE p2.email = 'knockriobeats@gmail.com'
              AND pt.type = 'sale'
              AND pt.status = 'pending'
              AND pt.created_at >= DATE_TRUNC('month', CURRENT_DATE)
              AND pt.created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        ), 0) THEN '✅ MATCH'
        ELSE '❌ MISMATCH'
    END as status
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.email = 'knockriobeats@gmail.com';

-- Also check if the trigger is working properly for future updates
SELECT 
    'Trigger Status Check' as section,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_recalculate_pending_balance_on_transactions';
