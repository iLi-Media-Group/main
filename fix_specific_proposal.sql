-- Fix a specific sync proposal by ID
-- Replace 'YOUR_PROPOSAL_ID_HERE' with the actual proposal ID

-- First, check the current status of the specific proposal
SELECT 
    id,
    status,
    client_status,
    producer_status,
    payment_status,
    sync_fee,
    final_amount,
    created_at,
    updated_at,
    payment_date
FROM sync_proposals 
WHERE id = 'YOUR_PROPOSAL_ID_HERE';

-- Fix the specific proposal
UPDATE sync_proposals 
SET 
    payment_status = 'paid',
    payment_date = NOW(),
    updated_at = NOW()
WHERE id = 'YOUR_PROPOSAL_ID_HERE'
  AND client_status = 'accepted'
  AND producer_status = 'accepted';

-- Verify the fix worked
SELECT 
    id,
    status,
    client_status,
    producer_status,
    payment_status,
    sync_fee,
    final_amount,
    created_at,
    updated_at,
    payment_date
FROM sync_proposals 
WHERE id = 'YOUR_PROPOSAL_ID_HERE'; 