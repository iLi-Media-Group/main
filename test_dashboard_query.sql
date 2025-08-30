-- Test the exact query that Rights Holder Dashboard is using
-- This will help us understand why it's not working

-- First, let's see what the current user context is
SELECT auth.uid() as current_user_id;

-- Test the exact query from the dashboard
-- This simulates what the Rights Holder Dashboard is trying to do
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
  AND (csr.selected_rights_holder_id IS NULL)  -- This should match our existing record
ORDER BY csr.created_at DESC;

-- Let's also test without any user-specific filtering
SELECT 
  csr.id,
  csr.status,
  csr.selected_rights_holder_id,
  csr.end_date,
  csr.project_title
FROM custom_sync_requests csr
WHERE csr.status = 'open' 
  AND csr.end_date >= NOW();

-- Check if RLS is actually blocking the query
-- This will show us what policies are active
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'custom_sync_requests';
