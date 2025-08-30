-- Check artist_invitations table for the same issues that affected producer_invitations

-- 1. Check RLS policies on artist_invitations table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'artist_invitations';

-- 2. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'artist_invitations';

-- 3. Check the table structure and constraints
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'artist_invitations'
ORDER BY ordinal_position;

-- 4. Check foreign key constraints
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'artist_invitations';

-- 5. Test the get_next_artist_number function
SELECT get_next_artist_number() as next_artist_number;

-- 6. Test insert to see what error we get
INSERT INTO artist_invitations (
  email, 
  first_name, 
  last_name, 
  invitation_code, 
  created_by, 
  artist_number
) VALUES (
  'test@example.com',
  'Test',
  'Artist',
  'testcode123',
  '00000000-0000-0000-0000-000000000000',
  'mbfar-999'
);
