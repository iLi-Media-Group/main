-- Test and fix sync proposal payment status
-- Run this in your Supabase SQL Editor

-- Step 1: Check current state
SELECT 'Current state of sync proposals:' as info;
SELECT 
    id,
    status,
    client_status,
    producer_status,
    payment_status,
    negotiation_status,
    sync_fee,
    created_at
FROM sync_proposals 
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: Check which proposals should be in "Paid" tab but aren't
SELECT 'Proposals that should be in Paid tab but are stuck:' as info;
SELECT 
    id,
    status,
    client_status,
    producer_status,
    payment_status,
    negotiation_status,
    sync_fee,
    created_at
FROM sync_proposals 
WHERE client_status = 'accepted' 
  AND producer_status = 'accepted'
  AND (payment_status = 'pending' OR payment_status IS NULL OR payment_status = '');

-- Step 3: Apply the fix
SELECT 'Applying fix...' as info;
UPDATE sync_proposals 
SET 
    payment_status = 'paid',
    payment_date = NOW(),
    status = 'accepted',
    negotiation_status = 'accepted',
    updated_at = NOW()
WHERE client_status = 'accepted' 
  AND producer_status = 'accepted'
  AND (payment_status = 'pending' OR payment_status IS NULL OR payment_status = '');

-- Step 4: Verify the fix worked
SELECT 'After fix - proposals that should now be in Paid tab:' as info;
SELECT 
    id,
    status,
    client_status,
    producer_status,
    payment_status,
    negotiation_status,
    sync_fee,
    created_at
FROM sync_proposals 
WHERE client_status = 'accepted' 
  AND producer_status = 'accepted' 
  AND payment_status = 'paid'
ORDER BY updated_at DESC;

-- Step 5: Check if any proposals are still stuck
SELECT 'Any proposals still stuck in pending:' as info;
SELECT 
    id,
    status,
    client_status,
    producer_status,
    payment_status,
    negotiation_status,
    sync_fee,
    created_at
FROM sync_proposals 
WHERE client_status = 'accepted' 
  AND producer_status = 'accepted'
  AND (payment_status = 'pending' OR payment_status IS NULL OR payment_status = ''); 