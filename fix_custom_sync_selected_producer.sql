-- Fix Custom Sync Requests Missing selected_producer_id
-- This script updates custom sync requests that have payment_status = 'paid' but missing selected_producer_id

-- Step 1: Check current state of paid custom sync requests
SELECT 'Current state of paid custom sync requests:' as info;
SELECT 
    csr.id,
    csr.project_title,
    csr.status,
    csr.payment_status,
    csr.selected_producer_id,
    csr.created_at,
    csr.updated_at
FROM custom_sync_requests csr
WHERE csr.payment_status = 'paid'
ORDER BY csr.created_at DESC;

-- Step 2: Find custom sync requests missing selected_producer_id
SELECT 'Custom sync requests missing selected_producer_id:' as info;
SELECT 
    csr.id,
    csr.project_title,
    csr.client_id,
    csr.status,
    csr.payment_status,
    csr.selected_producer_id
FROM custom_sync_requests csr
WHERE csr.payment_status = 'paid' 
  AND csr.selected_producer_id IS NULL;

-- Step 3: Update custom sync requests with missing selected_producer_id
UPDATE custom_sync_requests 
SET 
    selected_producer_id = (
        SELECT ss.producer_id
        FROM sync_request_selections srs
        JOIN sync_submissions ss ON srs.selected_submission_id = ss.id
        WHERE srs.sync_request_id = custom_sync_requests.id
        LIMIT 1
    ),
    updated_at = NOW()
WHERE payment_status = 'paid' 
  AND selected_producer_id IS NULL
  AND EXISTS (
      SELECT 1
      FROM sync_request_selections srs
      WHERE srs.sync_request_id = custom_sync_requests.id
  );

-- Step 4: Verify the fix
SELECT 'After fix - paid custom sync requests:' as info;
SELECT 
    csr.id,
    csr.project_title,
    csr.status,
    csr.payment_status,
    csr.selected_producer_id,
    csr.created_at,
    csr.updated_at
FROM custom_sync_requests csr
WHERE csr.payment_status = 'paid'
ORDER BY csr.created_at DESC;

-- Step 5: Check for any remaining issues
SELECT 'Remaining custom sync requests missing selected_producer_id:' as info;
SELECT 
    csr.id,
    csr.project_title,
    csr.client_id,
    csr.status,
    csr.payment_status,
    csr.selected_producer_id
FROM custom_sync_requests csr
WHERE csr.payment_status = 'paid' 
  AND csr.selected_producer_id IS NULL;
