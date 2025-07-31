-- Fix the INSERT policy for tracks table
-- The current policy has a null qualifier which is causing the RLS violation

-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Producers can insert own tracks" ON tracks;

-- Create a proper INSERT policy
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

-- Verify the fix
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'tracks' AND cmd = 'INSERT'
ORDER BY policyname; 