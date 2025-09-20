-- Test the current user context to see what's happening with authentication
-- This will help us understand if there's an authentication issue

-- Check current user context
SELECT auth.uid() as current_user_id;

-- Check if there are any active sessions
SELECT 
  id,
  user_id,
  created_at,
  expires_at,
  last_activity
FROM auth.sessions 
WHERE expires_at > NOW()
ORDER BY created_at DESC;

-- Check if the current user has a profile
SELECT 
  p.id,
  p.email,
  p.account_type,
  p.verification_status,
  p.terms_accepted,
  p.rights_authority_declaration_accepted
FROM profiles p
WHERE p.id = auth.uid();

-- Test the exact query that the Rights Holder Dashboard is using
-- But with explicit user ID instead of auth.uid()
-- Let's test with the babyimmastarrecords@gmail.com user ID
SELECT 
  csr.id,
  csr.status,
  csr.selected_rights_holder_id,
  csr.end_date,
  csr.project_title
FROM custom_sync_requests csr
WHERE csr.status = 'open' 
  AND csr.end_date >= NOW()
  AND (csr.selected_rights_holder_id IS NULL);  -- This should match our existing record

-- Check if there are any RLS policies that might be checking account_type
-- Let's see if any policies reference the profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'custom_sync_requests' 
  AND qual LIKE '%profiles%'
ORDER BY policyname;
