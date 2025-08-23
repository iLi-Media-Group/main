-- Check all custom sync requests in the database
SELECT
  'All custom sync requests' as info,
  id,
  client_id,
  project_title,
  project_description,
  sync_fee,
  end_date,
  status,
  selected_producer_id,
  created_at,
  updated_at
FROM custom_sync_requests
ORDER BY created_at DESC;

-- Check open requests that haven't expired
SELECT
  'Open requests that have not expired' as info,
  id,
  client_id,
  project_title,
  sync_fee,
  end_date,
  status,
  created_at
FROM custom_sync_requests
WHERE status = 'open'
  AND end_date >= NOW()
ORDER BY created_at DESC;

-- Check completed/paid requests for rights holders
SELECT
  'Completed/paid requests for rights holders' as info,
  id,
  client_id,
  project_title,
  sync_fee,
  status,
  selected_producer_id,
  created_at
FROM custom_sync_requests
WHERE status IN ('completed', 'paid')
  AND selected_producer_id IS NOT NULL
ORDER BY updated_at DESC;

-- Count by status
SELECT
  'Count by status' as info,
  status,
  COUNT(*) as count
FROM custom_sync_requests
GROUP BY status
ORDER BY status;
