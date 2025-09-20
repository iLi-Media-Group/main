-- Fix Genre RLS Policies
-- This script updates the RLS policies to allow producers to read genres and sub-genres
-- while keeping admin-only write access

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage genres" ON genres;
DROP POLICY IF EXISTS "Admins can manage sub_genres" ON sub_genres;

-- Create new policies that allow both admins and producers to read genres
CREATE POLICY "Admins and producers can read genres" ON genres
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type IN ('admin', 'producer', 'admin,producer')
    )
  );

-- Create policies that only allow admins to write to genres
CREATE POLICY "Admins can insert genres" ON genres
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type IN ('admin', 'admin,producer')
    )
  );

CREATE POLICY "Admins can update genres" ON genres
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type IN ('admin', 'admin,producer')
    )
  );

CREATE POLICY "Admins can delete genres" ON genres
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type IN ('admin', 'admin,producer')
    )
  );

-- Create new policies that allow both admins and producers to read sub_genres
CREATE POLICY "Admins and producers can read sub_genres" ON sub_genres
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type IN ('admin', 'producer', 'admin,producer')
    )
  );

-- Create policies that only allow admins to write to sub_genres
CREATE POLICY "Admins can insert sub_genres" ON sub_genres
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type IN ('admin', 'admin,producer')
    )
  );

CREATE POLICY "Admins can update sub_genres" ON sub_genres
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type IN ('admin', 'admin,producer')
    )
  );

CREATE POLICY "Admins can delete sub_genres" ON sub_genres
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type IN ('admin', 'admin,producer')
    )
  );

-- Verify the policies were created
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
WHERE tablename IN ('genres', 'sub_genres')
ORDER BY tablename, policyname; 