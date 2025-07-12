-- Fix All Transaction Types with Correct Compensation Rates
-- Run this in your Supabase SQL Editor

-- 1. Check current compensation settings
SELECT 
    standard_rate,
    exclusive_rate,
    sync_fee_rate,
    no_sales_bucket_rate,
    growth_bonus_rate,
    no_sale_bonus_rate
FROM compensation_settings 
WHERE id = 1;

-- 2. Show breakdown of all transaction types
SELECT 
    'Sync Proposals' as transaction_type,
    COUNT(*) as count,
    COALESCE(SUM(COALESCE(sp.final_amount, sp.sync_fee) * 0.90), 0) as total_amount
FROM sync_proposals sp
JOIN tracks t ON sp.track_id = t.id
WHERE sp.payment_status = 'paid'
  AND t.track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'

UNION ALL

SELECT 
    'Single Track Sales' as transaction_type,
    COUNT(*) as count,
    COALESCE(SUM(s.amount * 0.75), 0) as total_amount
FROM sales s
JOIN tracks t ON s.track_id = t.id
WHERE t.track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'

UNION ALL

SELECT 
    'Membership Transactions' as transaction_type,
    COUNT(*) as count,
    COALESCE(SUM(pt.amount), 0) as total_amount
FROM producer_transactions pt
WHERE pt.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND pt.type = 'sale'
  AND pt.reference_id NOT IN (
    SELECT id::text FROM sync_proposals WHERE payment_status = 'paid'
  )
  AND pt.reference_id NOT IN (
    SELECT id::text FROM sales
  )

UNION ALL

SELECT 
    'White Label Transactions' as transaction_type,
    COUNT(*) as count,
    COALESCE(SUM(pt.amount), 0) as total_amount
FROM producer_transactions pt
WHERE pt.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND pt.type = 'sale'
  AND pt.description ILIKE '%white label%';

-- 3. Show all current transactions with their types
SELECT 
    pt.id,
    pt.amount,
    pt.type,
    pt.status,
    pt.description,
    pt.track_title,
    pt.reference_id,
    pt.created_at,
    CASE 
        WHEN sp.id IS NOT NULL THEN 'Sync Proposal'
        WHEN s.id IS NOT NULL THEN 'Single Track Sale'
        WHEN pt.description ILIKE '%white label%' THEN 'White Label'
        WHEN pt.description ILIKE '%membership%' THEN 'Membership'
        ELSE 'Other'
    END as transaction_category
FROM producer_transactions pt
LEFT JOIN sync_proposals sp ON sp.id::text = pt.reference_id
LEFT JOIN sales s ON s.id::text = pt.reference_id
WHERE pt.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND pt.type = 'sale'
ORDER BY pt.created_at DESC;

-- 4. Update transaction amounts for sync proposals (90% rate)
UPDATE producer_transactions 
SET amount = (
    SELECT COALESCE(sp.final_amount, sp.sync_fee) * 0.90
    FROM sync_proposals sp
    WHERE sp.id::text = producer_transactions.reference_id
)
WHERE transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND type = 'sale'
  AND reference_id IN (
    SELECT id::text FROM sync_proposals 
    WHERE payment_status = 'paid'
  );

-- 5. Update transaction amounts for single track sales (75% rate)
UPDATE producer_transactions 
SET amount = (
    SELECT s.amount * 0.75
    FROM sales s
    WHERE s.id::text = producer_transactions.reference_id
)
WHERE transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND type = 'sale'
  AND reference_id IN (
    SELECT id::text FROM sales
  );

-- 6. For membership and white label transactions, keep existing amounts
-- (These are already calculated correctly by the system)

-- 7. Recalculate producer balance based on all corrected transaction amounts
UPDATE producer_balances 
SET 
    pending_balance = COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
          AND pt.type = 'sale'
          AND pt.status = 'pending'
    ), 0),
    lifetime_earnings = COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
          AND pt.type = 'sale'
    ), 0)
WHERE balance_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18';

-- 8. Show final results
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

-- 9. Show breakdown of corrected transactions by type
SELECT 
    CASE 
        WHEN sp.id IS NOT NULL THEN 'Sync Proposals (90%)'
        WHEN s.id IS NOT NULL THEN 'Single Track Sales (75%)'
        WHEN pt.description ILIKE '%white label%' THEN 'White Label'
        WHEN pt.description ILIKE '%membership%' THEN 'Membership'
        ELSE 'Other'
    END as transaction_type,
    COUNT(*) as count,
    COALESCE(SUM(pt.amount), 0) as total_amount
FROM producer_transactions pt
LEFT JOIN sync_proposals sp ON sp.id::text = pt.reference_id
LEFT JOIN sales s ON s.id::text = pt.reference_id
WHERE pt.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND pt.type = 'sale'
GROUP BY 
    CASE 
        WHEN sp.id IS NOT NULL THEN 'Sync Proposals (90%)'
        WHEN s.id IS NOT NULL THEN 'Single Track Sales (75%)'
        WHEN pt.description ILIKE '%white label%' THEN 'White Label'
        WHEN pt.description ILIKE '%membership%' THEN 'Membership'
        ELSE 'Other'
    END
ORDER BY total_amount DESC; 