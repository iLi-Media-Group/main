-- Diagnostic Script: Check July 2024 Transactions and Sync Proposals
-- Run this in your Supabase SQL Editor

-- 1. Check ALL paid sync proposals (not just July)
SELECT 
    sp.id,
    sp.sync_fee,
    sp.final_amount,
    sp.payment_status,
    sp.payment_date,
    sp.created_at,
    t.title as track_title,
    t.track_producer_id,
    p.first_name,
    p.last_name,
    COALESCE(sp.final_amount, sp.sync_fee) * 0.70 as producer_share
FROM sync_proposals sp
JOIN tracks t ON sp.track_id = t.id
JOIN profiles p ON t.track_producer_id = p.id
WHERE sp.payment_status = 'paid'
  AND t.track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
ORDER BY sp.payment_date DESC;

-- 2. Check ALL transactions for this producer
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
ORDER BY pt.created_at DESC;

-- 3. Check what dates are actually in the sync_proposals table
SELECT 
    MIN(payment_date) as earliest_payment_date,
    MAX(payment_date) as latest_payment_date,
    MIN(created_at) as earliest_created_at,
    MAX(created_at) as latest_created_at,
    COUNT(*) as total_paid_proposals
FROM sync_proposals 
WHERE payment_status = 'paid'
  AND id IN (
    SELECT sp.id 
    FROM sync_proposals sp
    JOIN tracks t ON sp.track_id = t.id
    WHERE t.track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  );

-- 4. Check what dates are actually in the producer_transactions table
SELECT 
    MIN(created_at) as earliest_transaction_date,
    MAX(created_at) as latest_transaction_date,
    COUNT(*) as total_transactions
FROM producer_transactions 
WHERE transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18';

-- 5. Check if there are any transactions with July 2024 dates
SELECT 
    pt.id,
    pt.amount,
    pt.type,
    pt.status,
    pt.description,
    pt.created_at,
    EXTRACT(YEAR FROM pt.created_at) as year,
    EXTRACT(MONTH FROM pt.created_at) as month
FROM producer_transactions pt
WHERE pt.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND EXTRACT(YEAR FROM pt.created_at) = 2024
  AND EXTRACT(MONTH FROM pt.created_at) = 7
ORDER BY pt.created_at DESC;

-- 6. Check if there are any sync proposals with July 2024 dates
SELECT 
    sp.id,
    sp.sync_fee,
    sp.final_amount,
    sp.payment_status,
    sp.payment_date,
    sp.created_at,
    EXTRACT(YEAR FROM sp.payment_date) as year,
    EXTRACT(MONTH FROM sp.payment_date) as month,
    t.title as track_title
FROM sync_proposals sp
JOIN tracks t ON sp.track_id = t.id
WHERE sp.payment_status = 'paid'
  AND t.track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND EXTRACT(YEAR FROM sp.payment_date) = 2024
  AND EXTRACT(MONTH FROM sp.payment_date) = 7
ORDER BY sp.payment_date DESC;

-- 7. Calculate total from ALL paid sync proposals (not just July)
SELECT 
    'Total from ALL Sync Proposals' as source,
    COALESCE(SUM(COALESCE(sp.final_amount, sp.sync_fee) * 0.70), 0) as total_amount
FROM sync_proposals sp
JOIN tracks t ON sp.track_id = t.id
WHERE sp.payment_status = 'paid'
  AND t.track_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'

UNION ALL

SELECT 
    'Total from ALL Transactions' as source,
    COALESCE(SUM(pt.amount), 0) as total_amount
FROM producer_transactions pt
WHERE pt.transaction_producer_id = '83e21f94-aced-452a-bafb-6eb9629e3b18'
  AND pt.type = 'sale'; 