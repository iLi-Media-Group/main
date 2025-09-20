-- Fix All Transaction Types for Producer Banking
-- This script ensures all three revenue sources are properly tracked:
-- 1. Sync Proposals
-- 2. Single Track Licenses  
-- 3. Custom Sync Requests

-- First, let's check the current state
SELECT 'Current paid sync proposals:' as info;
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

SELECT 'Current paid single track sales:' as info;
SELECT 
    s.id,
    s.amount,
    s.license_type,
    s.created_at,
    t.title as track_title,
    s.sale_producer_id,
    p.first_name,
    p.last_name
FROM sales s
JOIN tracks t ON s.track_id = t.id
JOIN profiles p ON s.sale_producer_id = p.id
WHERE s.amount > 0
ORDER BY s.created_at DESC;

SELECT 'Current paid custom sync requests:' as info;
SELECT 
    csr.id,
    csr.sync_fee,
    csr.final_amount,
    csr.payment_status,
    csr.created_at,
    csr.selected_producer_id,
    p.first_name,
    p.last_name
FROM custom_sync_requests csr
JOIN profiles p ON csr.selected_producer_id = p.id
WHERE csr.payment_status = 'paid'
ORDER BY csr.created_at DESC;

SELECT 'Current producer transactions:' as info;
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
ORDER BY pt.created_at DESC;

-- 1. Fix the calculate_producer_earnings trigger to use correct column names
CREATE OR REPLACE FUNCTION calculate_producer_earnings()
RETURNS TRIGGER AS $$
DECLARE
  producer_share NUMERIC;
  compensation_rate INTEGER;
  producer_id UUID;
BEGIN
  -- Get the appropriate compensation rate based on license type
  SELECT 
    CASE 
      WHEN NEW.license_type = 'Single Track' THEN standard_rate
      WHEN NEW.license_type ILIKE '%exclusive%' THEN exclusive_rate
      WHEN NEW.license_type ILIKE '%sync%' THEN sync_fee_rate
      ELSE standard_rate
    END INTO compensation_rate
  FROM compensation_settings
  LIMIT 1;

  -- Default to 70% if no settings found
  IF compensation_rate IS NULL THEN
    compensation_rate := 70;
  END IF;

  -- Get producer ID from the track
  SELECT track_producer_id INTO producer_id
  FROM tracks
  WHERE id = NEW.track_id;

  -- Calculate producer's share
  producer_share := (NEW.amount * compensation_rate / 100);

  -- Create a transaction record for the producer
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
    producer_id,
    producer_share,
    'sale',
    'pending',
    'Sale: ' || t.title || ' (' || NEW.license_type || ')',
    t.title,
    NEW.id::text,
    NEW.created_at
  FROM tracks t
  WHERE t.id = NEW.track_id;

  -- Update producer balance
  INSERT INTO producer_balances (
    balance_producer_id,
    available_balance,
    pending_balance,
    lifetime_earnings
  )
  VALUES (
    producer_id,
    0,
    producer_share,
    producer_share
  )
  ON CONFLICT (balance_producer_id) DO UPDATE
  SET 
    pending_balance = producer_balances.pending_balance + producer_share,
    lifetime_earnings = producer_balances.lifetime_earnings + producer_share;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS calculate_producer_earnings_trigger ON sales;
CREATE TRIGGER calculate_producer_earnings_trigger
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION calculate_producer_earnings();

-- 2. Create missing transaction records for existing paid sync proposals
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
    COALESCE(sp.final_amount, sp.sync_fee) * 0.70, -- 70% producer share
    'sale',
    'pending',
    'Sync Proposal: ' || t.title,
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

-- 3. Create missing transaction records for existing paid single track sales
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
    s.sale_producer_id,
    s.amount * 0.70, -- 70% producer share
    'sale',
    'pending',
    'Single Track License: ' || t.title,
    t.title,
    s.id::text,
    s.created_at
FROM sales s
JOIN tracks t ON s.track_id = t.id
WHERE s.amount > 0
  AND s.id::text NOT IN (
    SELECT reference_id FROM producer_transactions 
    WHERE reference_id IS NOT NULL
  );

-- 4. Create missing transaction records for existing paid custom sync requests
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
    COALESCE(csr.final_amount, csr.sync_fee) * 0.70, -- 70% producer share
    'sale',
    'pending',
    'Custom Sync: ' || COALESCE(csr.project_title, 'Custom Sync Request'),
    COALESCE(csr.project_title, 'Custom Sync Request'),
    csr.id::text,
    csr.created_at
FROM custom_sync_requests csr
WHERE csr.payment_status = 'paid'
  AND csr.selected_producer_id IS NOT NULL
  AND csr.id::text NOT IN (
    SELECT reference_id FROM producer_transactions 
    WHERE reference_id IS NOT NULL
  );

-- 5. Update producer balances for all transactions
WITH transaction_totals AS (
  SELECT 
    transaction_producer_id,
    SUM(amount) as total_amount
  FROM producer_transactions
  WHERE type = 'sale' AND status = 'pending'
  GROUP BY transaction_producer_id
)
INSERT INTO producer_balances (
    balance_producer_id,
    pending_balance,
    available_balance,
    lifetime_earnings
)
SELECT 
    tt.transaction_producer_id,
    tt.total_amount,
    0,
    tt.total_amount
FROM transaction_totals tt
ON CONFLICT (balance_producer_id) DO UPDATE
SET 
    pending_balance = EXCLUDED.pending_balance,
    lifetime_earnings = EXCLUDED.lifetime_earnings;

-- 6. Verify the results
SELECT 'Updated producer transactions:' as info;
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
ORDER BY pt.created_at DESC;

SELECT 'Updated producer balances:' as info;
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

-- 7. Summary of what was fixed
SELECT 'Summary of fixes applied:' as info;
SELECT 
    'Sync Proposals' as revenue_source,
    COUNT(*) as total_paid,
    SUM(COALESCE(sp.final_amount, sp.sync_fee)) as total_revenue
FROM sync_proposals sp
WHERE sp.payment_status = 'paid'
UNION ALL
SELECT 
    'Single Track Sales' as revenue_source,
    COUNT(*) as total_paid,
    SUM(s.amount) as total_revenue
FROM sales s
WHERE s.amount > 0
UNION ALL
SELECT 
    'Custom Sync Requests' as revenue_source,
    COUNT(*) as total_paid,
    SUM(COALESCE(csr.final_amount, csr.sync_fee)) as total_revenue
FROM custom_sync_requests csr
WHERE csr.payment_status = 'paid' AND csr.selected_producer_id IS NOT NULL; 