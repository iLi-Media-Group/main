-- Check custom sync requests data to see what's available

-- 1. Check all custom sync requests
SELECT 
  'All custom sync requests' as info,
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

-- 2. Check open requests that haven't expired
SELECT 
  'Open requests that have not expired' as info,
  id,
  client_id,
  project_title,
  status,
  end_date,
  selected_rights_holder_id,
  selected_producer_id,
  created_at
FROM custom_sync_requests
WHERE status = 'open' 
  AND end_date >= NOW()
ORDER BY created_at DESC;

-- 3. Check requests that should be visible to rights holders
-- (either no specific rights holder selected OR assigned to a specific rights holder)
SELECT 
  'Requests visible to rights holders' as info,
  id,
  client_id,
  project_title,
  status,
  end_date,
  selected_rights_holder_id,
  selected_producer_id,
  created_at
FROM custom_sync_requests
WHERE status = 'open' 
  AND end_date >= NOW()
  AND (selected_rights_holder_id IS NULL OR selected_rights_holder_id IS NOT NULL)
ORDER BY created_at DESC;

-- 4. Check if there are any requests specifically assigned to the babyimmastar account
SELECT 
  'Requests for babyimmastar' as info,
  csr.id,
  csr.client_id,
  csr.project_title,
  csr.status,
  csr.end_date,
  csr.selected_rights_holder_id,
  csr.selected_producer_id,
  csr.created_at,
  p.email as rights_holder_email,
  p.company_name as rights_holder_company
FROM custom_sync_requests csr
LEFT JOIN profiles p ON csr.selected_rights_holder_id = p.id
WHERE csr.selected_rights_holder_id = '9f8b5923-d118-43a6-8cd4-e2d9d25386d0'
ORDER BY csr.created_at DESC;
