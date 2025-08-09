-- Fix Custom Sync Request Revenue Tracking
-- Run this in your Supabase SQL Editor

-- First, let's check what paid custom sync requests we have
SELECT 
    csr.id,
    csr.sync_fee,
    csr.final_amount,
    csr.payment_status,
    csr.selected_producer_id,
    csr.project_title,
    p.first_name,
    p.last_name,
    p.email
FROM custom_sync_requests csr
JOIN profiles p ON csr.selected_producer_id = p.id
WHERE csr.payment_status = 'paid'
ORDER BY csr.updated_at DESC;

-- Check current transaction records for custom sync requests
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
    SELECT id::text FROM custom_sync_requests WHERE payment_status = 'paid'
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

-- 1. Create missing transaction records for paid custom sync requests
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
    csr.selected_producer_id,
    COALESCE(csr.final_amount, csr.sync_fee) * 0.70, -- 70% producer share (using sync_fee_rate)
    'sale',
    'pending',
    'Custom Sync: ' || COALESCE(csr.project_title, 'Custom Sync Request'),
    COALESCE(csr.project_title, 'Custom Sync Request'),
    csr.id::text,
    COALESCE(csr.updated_at, csr.created_at)
FROM custom_sync_requests csr
WHERE csr.payment_status = 'paid'
  AND csr.selected_producer_id IS NOT NULL
  AND csr.id::text NOT IN (
    SELECT reference_id FROM producer_transactions 
    WHERE reference_id IS NOT NULL
  );

-- 2. Update producer balances for paid custom sync requests
-- First, calculate the total amount each producer should receive from custom sync requests
WITH custom_sync_totals AS (
    SELECT 
        csr.selected_producer_id,
        SUM(COALESCE(csr.final_amount, csr.sync_fee) * 0.70) as total_custom_sync_revenue
    FROM custom_sync_requests csr
    WHERE csr.payment_status = 'paid'
      AND csr.selected_producer_id IS NOT NULL
      AND csr.id::text NOT IN (
        SELECT reference_id FROM producer_transactions 
        WHERE reference_id IS NOT NULL
      )
    GROUP BY csr.selected_producer_id
)
INSERT INTO producer_balances (
    balance_producer_id,
    pending_balance,
    available_balance,
    lifetime_earnings
)
SELECT 
    cst.selected_producer_id,
    cst.total_custom_sync_revenue,
    0,
    cst.total_custom_sync_revenue
FROM custom_sync_totals cst
ON CONFLICT (balance_producer_id) DO UPDATE
SET 
    pending_balance = producer_balances.pending_balance + EXCLUDED.pending_balance,
    lifetime_earnings = producer_balances.lifetime_earnings + EXCLUDED.lifetime_earnings;

-- 3. Add custom_sync_rate column to compensation_settings if it doesn't exist
ALTER TABLE compensation_settings 
ADD COLUMN IF NOT EXISTS custom_sync_rate INTEGER NOT NULL DEFAULT 70;

-- 4. Update the custom_sync_rate to match sync_fee_rate for consistency
UPDATE compensation_settings 
SET custom_sync_rate = sync_fee_rate 
WHERE id = 1;

-- 5. Verify the changes
SELECT 
    'Custom Sync Requests with missing transactions' as check_type,
    COUNT(*) as count
FROM custom_sync_requests csr
WHERE csr.payment_status = 'paid'
  AND csr.selected_producer_id IS NOT NULL
  AND csr.id::text NOT IN (
    SELECT reference_id FROM producer_transactions 
    WHERE reference_id IS NOT NULL
  )

UNION ALL

SELECT 
    'New transaction records created' as check_type,
    COUNT(*) as count
FROM producer_transactions pt
WHERE pt.reference_id IN (
    SELECT id::text FROM custom_sync_requests WHERE payment_status = 'paid'
)
AND pt.created_at >= NOW() - INTERVAL '1 hour';

-- 6. Show updated producer balances
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
