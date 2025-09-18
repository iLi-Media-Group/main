-- Debug script to identify why tracks table is returning 404 errors

-- 1. Check if tracks table exists and its structure
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'tracks' 
  AND table_schema = 'public';

-- 2. Check all columns in tracks table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'tracks';

-- 4. Check all RLS policies for tracks table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tracks'
ORDER BY policyname;

-- 5. Check if user is authenticated and has proper role
SELECT 
  current_user,
  session_user,
  auth.uid() as current_auth_uid;

-- 6. Test a simple SELECT to see if basic access works
SELECT COUNT(*) as track_count FROM tracks LIMIT 1;

-- 7. Check if there are any foreign key constraints that might be causing issues
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'tracks';
