-- Fix Transaction Compensation Rates Based on Compensation Settings
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

-- 2. Show current sync proposals with their calculated producer shares
SELECT 
    sp.id,
    sp.sync_fee,
    sp.final_amount,
    sp.payment_status,
    sp.payment_date,
    t.title as track_title,
    t.track_producer_id,
    -- Calculate correct producer share based on sync_fee_rate (90%)
    COALESCE(sp.final_amount, sp.sync_fee) * 0.90 as correct_producer_share,
    -- Show what the current transaction amount is
    pt.amount as current_transaction_amount
FROM sync_proposals sp
JOIN tracks t ON sp.track_id = t.id
LEFT JOIN producer_transactions pt ON pt.reference_id = sp.id::text
WHERE sp.payment_status = 'paid'
  AND t.track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
ORDER BY sp.payment_date DESC;

-- 3. Update transaction amounts to use correct compensation rates
UPDATE producer_transactions 
SET 
    amount = (
        SELECT 
            CASE 
                -- For sync proposals, use sync_fee_rate (90%)
                WHEN sp.id IS NOT NULL THEN COALESCE(sp.final_amount, sp.sync_fee) * 0.90
                -- For regular sales, use standard_rate (75%)
                WHEN s.id IS NOT NULL THEN s.amount * 0.75
                -- Default fallback
                ELSE producer_transactions.amount
            END
        FROM sync_proposals sp
        FULL OUTER JOIN sales s ON s.id::text = producer_transactions.reference_id
        WHERE (sp.id::text = producer_transactions.reference_id OR s.id::text = producer_transactions.reference_id)
    )
WHERE transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND type = 'sale'
  AND reference_id IS NOT NULL;

-- 4. Recalculate producer balance based on corrected transaction amounts
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

-- 5. Show final results
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

-- 6. Show corrected transaction amounts
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

-- 7. Show total from corrected transactions
SELECT 
    'Total from Corrected Transactions' as source,
    COALESCE(SUM(pt.amount), 0) as total_amount
FROM producer_transactions pt
WHERE pt.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND pt.type = 'sale'

UNION ALL

SELECT 
    'Total from Sync Proposals (90% rate)' as source,
    COALESCE(SUM(COALESCE(sp.final_amount, sp.sync_fee) * 0.90), 0) as total_amount
FROM sync_proposals sp
JOIN tracks t ON sp.track_id = t.id
WHERE sp.payment_status = 'paid'
  AND t.track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'; 