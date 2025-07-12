-- Fix Balance Mismatch: Investigate and Fix Transaction vs Sync Proposal Totals
-- Run this in your Supabase SQL Editor

-- 1. Show all sync proposals with their calculated producer share
SELECT 
    sp.id,
    sp.sync_fee,
    sp.final_amount,
    COALESCE(sp.final_amount, sp.sync_fee) * 0.70 as calculated_producer_share,
    sp.payment_date,
    t.title as track_title,
    t.track_producer_id
FROM sync_proposals sp
JOIN tracks t ON sp.track_id = t.id
WHERE sp.payment_status = 'paid'
  AND t.track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
ORDER BY sp.payment_date DESC;

-- 2. Show all transactions with their amounts
SELECT 
    pt.id,
    pt.amount,
    pt.type,
    pt.status,
    pt.description,
    pt.track_title,
    pt.reference_id,
    pt.created_at
FROM producer_transactions pt
WHERE pt.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND pt.type = 'sale'
ORDER BY pt.created_at DESC;

-- 3. Check for duplicate transaction records
SELECT 
    pt.reference_id,
    COUNT(*) as duplicate_count,
    SUM(pt.amount) as total_amount,
    STRING_AGG(pt.id::text, ', ') as transaction_ids
FROM producer_transactions pt
WHERE pt.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND pt.type = 'sale'
  AND pt.reference_id IS NOT NULL
GROUP BY pt.reference_id
HAVING COUNT(*) > 1;

-- 4. Check for transactions without matching sync proposals
SELECT 
    pt.id,
    pt.amount,
    pt.description,
    pt.reference_id,
    pt.created_at,
    CASE 
        WHEN sp.id IS NULL THEN 'NO MATCHING SYNC PROPOSAL'
        ELSE 'MATCHES SYNC PROPOSAL'
    END as sync_proposal_status
FROM producer_transactions pt
LEFT JOIN sync_proposals sp ON pt.reference_id = sp.id::text
WHERE pt.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND pt.type = 'sale'
ORDER BY pt.created_at DESC;

-- 5. Remove duplicate transaction records (keep the first one)
DELETE FROM producer_transactions 
WHERE id IN (
    SELECT pt.id
    FROM producer_transactions pt
    WHERE pt.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
      AND pt.type = 'sale'
      AND pt.reference_id IS NOT NULL
      AND pt.id NOT IN (
          SELECT MIN(pt2.id)
          FROM producer_transactions pt2
          WHERE pt2.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
            AND pt2.type = 'sale'
            AND pt2.reference_id IS NOT NULL
          GROUP BY pt2.reference_id
      )
);

-- 6. Recalculate producer balance based on sync proposals (the source of truth)
UPDATE producer_balances 
SET 
    pending_balance = COALESCE((
        SELECT SUM(COALESCE(sp.final_amount, sp.sync_fee) * 0.70)
        FROM sync_proposals sp
        JOIN tracks t ON sp.track_id = t.id
        WHERE sp.payment_status = 'paid'
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

-- 7. Show final results
SELECT 
    'Updated Producer Balance' as table_name,
    pb.pending_balance,
    pb.available_balance,
    pb.lifetime_earnings
FROM producer_balances pb
WHERE pb.balance_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'

UNION ALL

SELECT 
    'Total Transactions Count' as table_name,
    COUNT(*)::numeric as pending_balance,
    0 as available_balance,
    0 as lifetime_earnings
FROM producer_transactions pt
WHERE pt.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND pt.type = 'sale';

-- 8. Show final comparison
SELECT 
    'Total from Sync Proposals' as source,
    COALESCE(SUM(COALESCE(sp.final_amount, sp.sync_fee) * 0.70), 0) as total_amount
FROM sync_proposals sp
JOIN tracks t ON sp.track_id = t.id
WHERE sp.payment_status = 'paid'
  AND t.track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'

UNION ALL

SELECT 
    'Total from Transactions (After Cleanup)' as source,
    COALESCE(SUM(pt.amount), 0) as total_amount
FROM producer_transactions pt
WHERE pt.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND pt.type = 'sale'; 