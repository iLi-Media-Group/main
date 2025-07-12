-- Fix All Producers Compensation Rates
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

-- 2. Show all producers and their current balances
SELECT 
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
    pb.pending_balance,
    pb.available_balance,
    pb.lifetime_earnings
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type = 'producer'
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 3. Show breakdown of all transaction types for ALL producers
SELECT 
    'Sync Proposals' as transaction_type,
    COUNT(*) as count,
    COALESCE(SUM(COALESCE(sp.final_amount, sp.sync_fee) * 0.90), 0) as total_amount
FROM sync_proposals sp
JOIN tracks t ON sp.track_id = t.id
WHERE sp.payment_status = 'paid'

UNION ALL

SELECT 
    'Custom Sync Requests' as transaction_type,
    COUNT(*) as count,
    COALESCE(SUM(COALESCE(csr.final_amount, csr.sync_fee) * 0.90), 0) as total_amount
FROM custom_sync_requests csr
JOIN tracks t ON csr.track_id = t.id
WHERE csr.payment_status = 'paid'

UNION ALL

SELECT 
    'Single Track Sales' as transaction_type,
    COUNT(*) as count,
    COALESCE(SUM(s.amount * 0.75), 0) as total_amount
FROM sales s
JOIN tracks t ON s.track_id = t.id

UNION ALL

SELECT 
    'Membership Transactions' as transaction_type,
    COUNT(*) as count,
    COALESCE(SUM(pt.amount), 0) as total_amount
FROM producer_transactions pt
WHERE pt.type = 'sale'
  AND pt.reference_id NOT IN (
    SELECT id::text FROM sync_proposals WHERE payment_status = 'paid'
  )
  AND pt.reference_id NOT IN (
    SELECT id::text FROM custom_sync_requests WHERE payment_status = 'paid'
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
WHERE pt.type = 'sale'
  AND pt.description ILIKE '%white label%';

-- 4. Update transaction amounts for sync proposals (90% rate) for ALL producers
UPDATE producer_transactions 
SET amount = (
    SELECT COALESCE(sp.final_amount, sp.sync_fee) * 0.90
    FROM sync_proposals sp
    WHERE sp.id::text = producer_transactions.reference_id
)
WHERE type = 'sale'
  AND reference_id IN (
    SELECT id::text FROM sync_proposals 
    WHERE payment_status = 'paid'
  );

-- 5. Update transaction amounts for custom sync requests (90% rate) for ALL producers
UPDATE producer_transactions 
SET amount = (
    SELECT COALESCE(csr.final_amount, csr.sync_fee) * 0.90
    FROM custom_sync_requests csr
    WHERE csr.id::text = producer_transactions.reference_id
)
WHERE type = 'sale'
  AND reference_id IN (
    SELECT id::text FROM custom_sync_requests 
    WHERE payment_status = 'paid'
  );

-- 6. Update transaction amounts for single track sales (75% rate) for ALL producers
UPDATE producer_transactions 
SET amount = (
    SELECT s.amount * 0.75
    FROM sales s
    WHERE s.id::text = producer_transactions.reference_id
)
WHERE type = 'sale'
  AND reference_id IN (
    SELECT id::text FROM sales
  );

-- 7. For membership and white label transactions, keep existing amounts
-- (These are already calculated correctly by the system)

-- 8. Recalculate producer balances for ALL producers
UPDATE producer_balances 
SET 
    pending_balance = COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = producer_balances.balance_producer_id
          AND pt.type = 'sale'
          AND pt.status = 'pending'
    ), 0),
    lifetime_earnings = COALESCE((
        SELECT SUM(pt.amount)
        FROM producer_transactions pt
        WHERE pt.transaction_producer_id = producer_balances.balance_producer_id
          AND pt.type = 'sale'
    ), 0);

-- 9. Show updated producer balances for ALL producers
SELECT 
    p.id as producer_id,
    p.first_name,
    p.last_name,
    p.email,
    pb.pending_balance,
    pb.available_balance,
    pb.lifetime_earnings
FROM profiles p
LEFT JOIN producer_balances pb ON pb.balance_producer_id = p.id
WHERE p.account_type = 'producer'
ORDER BY pb.lifetime_earnings DESC NULLS LAST;

-- 10. Show breakdown of corrected transactions by type for ALL producers
SELECT 
    CASE 
        WHEN sp.id IS NOT NULL THEN 'Sync Proposals (90%)'
        WHEN csr.id IS NOT NULL THEN 'Custom Sync Requests (90%)'
        WHEN s.id IS NOT NULL THEN 'Single Track Sales (75%)'
        WHEN pt.description ILIKE '%white label%' THEN 'White Label'
        WHEN pt.description ILIKE '%membership%' THEN 'Membership'
        ELSE 'Other'
    END as transaction_type,
    COUNT(*) as count,
    COALESCE(SUM(pt.amount), 0) as total_amount
FROM producer_transactions pt
LEFT JOIN sync_proposals sp ON sp.id::text = pt.reference_id
LEFT JOIN custom_sync_requests csr ON csr.id::text = pt.reference_id
LEFT JOIN sales s ON s.id::text = pt.reference_id
WHERE pt.type = 'sale'
GROUP BY 
    CASE 
        WHEN sp.id IS NOT NULL THEN 'Sync Proposals (90%)'
        WHEN csr.id IS NOT NULL THEN 'Custom Sync Requests (90%)'
        WHEN s.id IS NOT NULL THEN 'Single Track Sales (75%)'
        WHEN pt.description ILIKE '%white label%' THEN 'White Label'
        WHEN pt.description ILIKE '%membership%' THEN 'Membership'
        ELSE 'Other'
    END
ORDER BY total_amount DESC;

-- 11. Show total transaction count for ALL producers
SELECT 
    'Total Transactions Count' as metric,
    COUNT(*) as value
FROM producer_transactions pt
WHERE pt.type = 'sale'

UNION ALL

SELECT 
    'Total Producers' as metric,
    COUNT(*) as value
FROM profiles p
WHERE p.account_type = 'producer'; 