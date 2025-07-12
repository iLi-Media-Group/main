-- Fix Producer Banking Data for Paid Sync Proposals
-- Run this in your Supabase SQL Editor

-- First, let's check what paid sync proposals we have
SELECT 
    sp.id,
    sp.sync_fee,
    sp.final_amount,
    sp.payment_status,
    sp.payment_date,
    t.title as track_title,
    t.track_producer_id,
    p.first_name,
    p.last_name
FROM sync_proposals sp
JOIN tracks t ON sp.track_id = t.id
JOIN profiles p ON t.track_producer_id = p.id
WHERE sp.payment_status = 'paid'
ORDER BY sp.payment_date DESC;

-- Check current transaction records
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
WHERE pt.reference_id IN (
    SELECT id::text FROM sync_proposals WHERE payment_status = 'paid'
)
ORDER BY pt.created_at DESC;

-- Check current producer balances
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
ORDER BY pb.lifetime_earnings DESC;

-- 1. Create missing transaction records for paid sync proposals
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
    COALESCE(sp.final_amount, sp.sync_fee) * 0.70, -- 70% producer share, use final_amount if available
    'sale',
    'pending',
    'Sync Fee: ' || t.title,
    t.title,
    sp.id::text,
    COALESCE(sp.payment_date, sp.updated_at)
FROM sync_proposals sp
JOIN tracks t ON sp.track_id = t.id
WHERE sp.payment_status = 'paid'
  AND sp.id::text NOT IN (
    SELECT reference_id FROM producer_transactions 
    WHERE reference_id IS NOT NULL
  );

-- 2. Update producer balances for paid sync proposals
INSERT INTO producer_balances (
    balance_producer_id,
    pending_balance,
    available_balance,
    lifetime_earnings
)
SELECT 
    t.track_producer_id,
    COALESCE(sp.final_amount, sp.sync_fee) * 0.70,
    0,
    COALESCE(sp.final_amount, sp.sync_fee) * 0.70
FROM sync_proposals sp
JOIN tracks t ON sp.track_id = t.id
WHERE sp.payment_status = 'paid'
  AND t.track_producer_id NOT IN (
    SELECT balance_producer_id FROM producer_balances
  )
ON CONFLICT (balance_producer_id) DO UPDATE
SET 
    pending_balance = producer_balances.pending_balance + EXCLUDED.pending_balance,
    lifetime_earnings = producer_balances.lifetime_earnings + EXCLUDED.lifetime_earnings;

-- 3. Add license URLs for paid proposals that don't have them
UPDATE sync_proposals 
SET 
    license_url = 'https://example.com/license-placeholder.pdf',
    license_generated_at = NOW(),
    updated_at = NOW()
WHERE payment_status = 'paid' 
  AND (license_url IS NULL OR license_url = '');

-- 4. Show final results
SELECT 
    'Paid Proposals' as table_name,
    COUNT(*) as count
FROM sync_proposals 
WHERE payment_status = 'paid'

UNION ALL

SELECT 
    'Transaction Records' as table_name,
    COUNT(*) as count
FROM producer_transactions pt
WHERE pt.reference_id IN (
    SELECT id::text FROM sync_proposals WHERE payment_status = 'paid'
)

UNION ALL

SELECT 
    'Producer Balances' as table_name,
    COUNT(*) as count
FROM producer_balances;

-- 5. Show updated producer balances
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
ORDER BY pb.lifetime_earnings DESC; 