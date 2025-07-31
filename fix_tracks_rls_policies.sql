-- Fix RLS policies for tracks table to use correct column name
-- The tracks table uses 'track_producer_id' but policies still reference 'producer_id'

-- Drop existing policies
DROP POLICY IF EXISTS "Producers can insert own tracks" ON tracks;
DROP POLICY IF EXISTS "Producers can update own tracks" ON tracks;
DROP POLICY IF EXISTS "Producers can delete own tracks" ON tracks;
DROP POLICY IF EXISTS "Tracks are viewable by everyone" ON tracks;

-- Create new policies with correct column name
CREATE POLICY "Producers can insert own tracks" ON tracks
  FOR INSERT
  WITH CHECK (
    auth.uid() = track_producer_id 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = ANY (ARRAY['producer', 'admin', 'admin,producer'])
    )
  );

CREATE POLICY "Producers can update own tracks" ON tracks
  FOR UPDATE
  USING (
    auth.uid() = track_producer_id
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = 'admin'
    )
  );

CREATE POLICY "Producers can delete own tracks" ON tracks
  FOR DELETE
  USING (
    auth.uid() = track_producer_id
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type = 'admin'
    )
  );

CREATE POLICY "Tracks are viewable by everyone" ON tracks
  FOR SELECT
  USING (true);

-- Verify the policies were created correctly
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'tracks'
ORDER BY policyname; 