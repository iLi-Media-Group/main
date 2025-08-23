-- Test the exact RLS policy logic to see what's happening
-- Let's check what the current user context is and test the policy

-- Check current user context
SELECT auth.uid() as current_user_id;

-- Test the exact condition from the RLS policy
-- The policy condition is:
-- (status = 'open' AND end_date >= NOW()) AND
-- (
--   (selected_producer_id IS NOT NULL AND auth.uid() = selected_producer_id) OR
--   (selected_rights_holder_id IS NOT NULL AND auth.uid() = selected_rights_holder_id) OR
--   (selected_producer_id IS NULL AND selected_rights_holder_id IS NULL)
-- )

-- Let's test each part:
SELECT 
  id,
  status,
  selected_producer_id,
  selected_rights_holder_id,
  end_date,
  NOW() as current_time,
  end_date >= NOW() as is_future,
  status = 'open' as is_open,
  selected_producer_id IS NULL as producer_null,
  selected_rights_holder_id IS NULL as rights_holder_null,
  (selected_producer_id IS NULL AND selected_rights_holder_id IS NULL) as both_null
FROM custom_sync_requests 
WHERE status = 'open';

-- Test if the policy condition would match for the current user
SELECT 
  id,
  status,
  selected_producer_id,
  selected_rights_holder_id,
  end_date,
  (status = 'open' AND end_date >= NOW()) as basic_condition,
  (selected_producer_id IS NULL AND selected_rights_holder_id IS NULL) as case_3_condition
FROM custom_sync_requests 
WHERE status = 'open' AND end_date >= NOW();
