-- Fix Missing Transactions and Balance Calculation for July 2024
-- Run this in your Supabase SQL Editor

-- First, let's see all paid sync proposals for July 2024
SELECT 
    sp.id,
    sp.sync_fee,
    sp.final_amount,
    sp.payment_status,
    sp.payment_date,
    t.title as track_title,
    t.track_producer_id,
    p.first_name,
    p.last_name,
    COALESCE(sp.final_amount, sp.sync_fee) * 0.70 as producer_share
FROM sync_proposals sp
JOIN tracks t ON sp.track_id = t.id
JOIN profiles p ON t.track_producer_id = p.id
WHERE sp.payment_status = 'paid'
  AND sp.payment_date >= '2024-07-01'
  AND sp.payment_date < '2024-08-01'
ORDER BY sp.payment_date DESC;

-- Check current transaction records for July 2024
SELECT 
    pt.id,
    pt.transaction_producer_id,
    pt.amount,
    pt.type,
    pt.status,
    pt.description,
    pt.track_title,
    pt.reference_id,
    pt.created_at
FROM producer_transactions pt
WHERE pt.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND pt.created_at >= '2024-07-01'
  AND pt.created_at < '2024-08-01'
ORDER BY pt.created_at DESC;

-- Calculate the total amount that should be in pending balance
SELECT 
    'Total from Sync Proposals' as source,
    COALESCE(SUM(COALESCE(sp.final_amount, sp.sync_fee) * 0.70), 0) as total_amount
FROM sync_proposals sp
JOIN tracks t ON sp.track_id = t.id
WHERE sp.payment_status = 'paid'
  AND sp.payment_date >= '2024-07-01'
  AND sp.payment_date < '2024-08-01'
  AND t.track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'

UNION ALL

SELECT 
    'Total from Transactions' as source,
    COALESCE(SUM(pt.amount), 0) as total_amount
FROM producer_transactions pt
WHERE pt.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND pt.created_at >= '2024-07-01'
  AND pt.created_at < '2024-08-01'
  AND pt.type = 'sale';

-- Check current producer balance
SELECT 
    pb.balance_producer_id,
    pb.available_balance,
    pb.pending_balance,
    pb.lifetime_earnings,
    p.first_name,
    p.last_name,
    p.email
FROM producer_balances pb
JOIN profiles p ON pb.balance_producer_id = p.id
WHERE pb.balance_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18';

-- 1. Create missing transaction records for July 2024 paid sync proposals
INSERT INTO producer_transactions (
    transaction_producer_id,
    amount,
    type,
    status,
    description,
    track_title,
    reference_id,
    created_at
)
SELECT 
    t.track_producer_id,
    COALESCE(sp.final_amount, sp.sync_fee) * 0.70,
    'sale',
    'pending',
    'Sync Fee: ' || t.title,
    t.title,
    sp.id::text,
    COALESCE(sp.payment_date, sp.updated_at)
FROM sync_proposals sp
JOIN tracks t ON sp.track_id = t.id
WHERE sp.payment_status = 'paid'
  AND sp.payment_date >= '2024-07-01'
  AND sp.payment_date < '2024-08-01'
  AND t.track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND sp.id::text NOT IN (
    SELECT reference_id FROM producer_transactions 
    WHERE reference_id IS NOT NULL
  );

-- 2. Update producer balance with correct July 2024 total (with NULL handling)
UPDATE producer_balances 
SET 
    pending_balance = COALESCE((
        SELECT SUM(COALESCE(sp.final_amount, sp.sync_fee) * 0.70)
        FROM sync_proposals sp
        JOIN tracks t ON sp.track_id = t.id
        WHERE sp.payment_status = 'paid'
          AND sp.payment_date >= '2024-07-01'
          AND sp.payment_date < '2024-08-01'
          AND t.track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
    ), 0),
    lifetime_earnings = COALESCE((
        SELECT SUM(COALESCE(sp.final_amount, sp.sync_fee) * 0.70)
        FROM sync_proposals sp
        JOIN tracks t ON sp.track_id = t.id
        WHERE sp.payment_status = 'paid'
          AND t.track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
    ), 0)
WHERE balance_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18';

-- 3. Show final results
SELECT 
    'Updated Producer Balance' as table_name,
    pb.pending_balance,
    pb.available_balance,
    pb.lifetime_earnings
FROM producer_balances pb
WHERE pb.balance_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'

UNION ALL

SELECT 
    'July 2024 Transactions Count' as table_name,
    COUNT(*)::numeric as pending_balance,
    0 as available_balance,
    0 as lifetime_earnings
FROM producer_transactions pt
WHERE pt.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND pt.created_at >= '2024-07-01'
  AND pt.created_at < '2024-08-01'
  AND pt.type = 'sale';

-- 4. Show all July 2024 transactions
SELECT 
    pt.id,
    pt.amount,
    pt.type,
    pt.status,
    pt.description,
    pt.track_title,
    pt.created_at
FROM producer_transactions pt
WHERE pt.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND pt.created_at >= '2024-07-01'
  AND pt.created_at < '2024-08-01'
  AND pt.type = 'sale'
ORDER BY pt.created_at DESC; 