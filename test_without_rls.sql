-- Temporarily disable RLS to test if that's the issue
-- This will help us determine if RLS is blocking the query

-- Disable RLS temporarily
ALTER TABLE custom_sync_requests DISABLE ROW LEVEL SECURITY;

-- Test the query without RLS
SELECT COUNT(*) as open_requests_count 
FROM custom_sync_requests 
WHERE status = 'open' AND end_date >= NOW();

-- Test the exact query from the dashboard
SELECT 
  csr.*,
  p.id as client_id,
  p.first_name,
  p.last_name,
  p.email as client_email
FROM custom_sync_requests csr
LEFT JOIN profiles p ON csr.client_id = p.id
WHERE csr.status = 'open' 
  AND csr.end_date >= NOW()
  AND (csr.selected_rights_holder_id IS NULL)
ORDER BY csr.created_at DESC;

-- Re-enable RLS
ALTER TABLE custom_sync_requests ENABLE ROW LEVEL SECURITY;
