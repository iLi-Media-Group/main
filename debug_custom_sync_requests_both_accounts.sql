-- Debug custom sync requests for both accounts
-- Check the user IDs first
SELECT 
  'User IDs' as info,
  id,
  email,
  account_type,
  verification_status,
  is_active
FROM profiles
WHERE email IN ('babyimmastarrecords@gmail.com', 'ilimediagroup@gmail.com');

-- Check all custom sync requests
SELECT 
  'All Custom Sync Requests' as info,
  id,
  client_id,
  project_title,
  status,
  end_date,
  selected_rights_holder_id,
  selected_producer_id,
  created_at
FROM custom_sync_requests
ORDER BY created_at DESC;

-- Check what the query should return for babyimmastarrecords@gmail.com
-- (assuming user ID from above query)
SELECT 
  'Query for babyimmastarrecords' as info,
  csr.id,
  csr.client_id,
  csr.project_title,
  csr.status,
  csr.end_date,
  csr.selected_rights_holder_id,
  csr.selected_producer_id,
  csr.created_at,
  NOW() as current_time,
  (csr.end_date >= NOW()) as not_expired
FROM custom_sync_requests csr
WHERE csr.status = 'open' 
  AND csr.end_date >= NOW()
  AND (
    csr.selected_rights_holder_id = 'c5988a02-36b2-4225-b26e-fabfaa5796dc' 
    OR csr.selected_rights_holder_id IS NULL
  )
ORDER BY csr.created_at DESC;

-- Check what the query should return for ilimediagroup@gmail.com
SELECT 
  'Query for ilimediagroup' as info,
  csr.id,
  csr.client_id,
  csr.project_title,
  csr.status,
  csr.end_date,
  csr.selected_rights_holder_id,
  csr.selected_producer_id,
  csr.created_at,
  NOW() as current_time,
  (csr.end_date >= NOW()) as not_expired
FROM custom_sync_requests csr
WHERE csr.status = 'open' 
  AND csr.end_date >= NOW()
  AND (
    csr.selected_rights_holder_id = 'c5988a02-36b2-4225-b26e-fabfaa5796dc' 
    OR csr.selected_rights_holder_id IS NULL
  )
ORDER BY csr.created_at DESC;
