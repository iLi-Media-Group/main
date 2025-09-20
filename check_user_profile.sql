-- Check user authentication and profile to debug tracks 404 error

-- 1. Check current authentication status
SELECT 
  current_user,
  session_user,
  auth.uid() as current_auth_uid;

-- 2. Check if the current user has a profile
SELECT 
  id,
  email,
  full_name,
  created_at
FROM profiles 
WHERE id = auth.uid();

-- 3. Check if there are any tracks for this user
SELECT 
  id,
  title,
  track_producer_id,
  created_at
FROM tracks 
WHERE track_producer_id = auth.uid()
LIMIT 5;

-- 4. Test inserting a simple record to see the exact error
-- (This will help identify if it's a foreign key constraint issue)
INSERT INTO tracks (
  title,
  track_producer_id,
  created_at,
  updated_at
) VALUES (
  'TEST_TRACK_' || extract(epoch from now()),
  auth.uid(),
  now(),
  now()
) RETURNING id, title, track_producer_id;

-- 5. Clean up the test record
DELETE FROM tracks WHERE title LIKE 'TEST_TRACK_%';
