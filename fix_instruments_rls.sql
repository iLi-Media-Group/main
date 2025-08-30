-- Fix RLS policies for instrument_categories and instruments tables
-- These tables should be publicly viewable for the track upload process

-- First, let's check the current RLS status and policies
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
WHERE tablename IN ('instrument_categories', 'instruments')
ORDER BY tablename, policyname;

-- Disable RLS on instrument_categories and add SELECT policy
ALTER TABLE instrument_categories DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Instrument categories are viewable by everyone" ON instrument_categories;
CREATE POLICY "Instrument categories are viewable by everyone" ON instrument_categories
  FOR SELECT
  USING (true);

-- Disable RLS on instruments and add SELECT policy  
ALTER TABLE instruments DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Instruments are viewable by everyone" ON instruments;
CREATE POLICY "Instruments are viewable by everyone" ON instruments
  FOR SELECT
  USING (true);

-- Verify the changes
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
WHERE tablename IN ('instrument_categories', 'instruments')
ORDER BY tablename, policyname;
