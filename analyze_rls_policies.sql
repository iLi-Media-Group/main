-- Analyze RLS Policies for Producer Names Issue
-- This script will show all policies that could be blocking the profiles join

-- ============================================
-- 1. CHECK TRACKS TABLE RLS POLICIES
-- ============================================
SELECT '=== TRACKS TABLE RLS POLICIES ===' as section;

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

-- ============================================
-- 2. CHECK PROFILES TABLE RLS POLICIES
-- ============================================
SELECT '=== PROFILES TABLE RLS POLICIES ===' as section;

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
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================
-- 3. CHECK IF RLS IS ENABLED ON TABLES
-- ============================================
SELECT '=== RLS STATUS ON TABLES ===' as section;

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('tracks', 'profiles')
ORDER BY tablename;

-- ============================================
-- 4. CHECK FOREIGN KEY RELATIONSHIPS
-- ============================================
SELECT '=== FOREIGN KEY RELATIONSHIPS ===' as section;

SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('tracks', 'profiles')
  AND ccu.table_name IN ('tracks', 'profiles')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 5. TEST THE EXACT QUERY FROM CATALOGPAGE
-- ============================================
SELECT '=== TESTING CATALOGPAGE QUERY ===' as section;

-- Test the exact query that CatalogPage uses
SELECT 
  t.id,
  t.title,
  t.track_producer_id,
  p.id as producer_id,
  p.first_name,
  p.last_name,
  p.email
FROM tracks t
LEFT JOIN profiles p ON t.track_producer_id = p.id
WHERE t.deleted_at IS NULL
LIMIT 5;

-- ============================================
-- 6. CHECK IF PROFILES DATA EXISTS
-- ============================================
SELECT '=== PROFILES DATA CHECK ===' as section;

SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN first_name IS NOT NULL THEN 1 END) as profiles_with_first_name,
  COUNT(CASE WHEN last_name IS NOT NULL THEN 1 END) as profiles_with_last_name,
  COUNT(CASE WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 1 END) as complete_names
FROM profiles;

-- ============================================
-- 7. CHECK TRACKS WITH MISSING PRODUCER DATA
-- ============================================
SELECT '=== TRACKS WITH MISSING PRODUCER DATA ===' as section;

SELECT 
  COUNT(*) as total_tracks,
  COUNT(CASE WHEN track_producer_id IS NOT NULL THEN 1 END) as tracks_with_producer_id,
  COUNT(CASE WHEN track_producer_id IS NULL THEN 1 END) as tracks_without_producer_id
FROM tracks 
WHERE deleted_at IS NULL;

-- ============================================
-- 8. CHECK SAMPLE TRACK DATA
-- ============================================
SELECT '=== SAMPLE TRACK DATA ===' as section;

SELECT 
  id,
  title,
  track_producer_id,
  created_at
FROM tracks 
WHERE deleted_at IS NULL 
  AND track_producer_id IS NOT NULL
ORDER BY created_at DESC 
LIMIT 5;

-- ============================================
-- 9. CHECK SAMPLE PROFILE DATA
-- ============================================
SELECT '=== SAMPLE PROFILE DATA ===' as section;

SELECT 
  id,
  first_name,
  last_name,
  email,
  created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- ============================================
-- 10. TEST JOIN WITH AUTH CONTEXT
-- ============================================
SELECT '=== JOIN TEST WITH SAMPLE DATA ===' as section;

-- Test the join with a specific track_producer_id
WITH sample_track AS (
  SELECT track_producer_id 
  FROM tracks 
  WHERE deleted_at IS NULL 
    AND track_producer_id IS NOT NULL 
  LIMIT 1
)
SELECT 
  t.id as track_id,
  t.title,
  t.track_producer_id,
  p.id as producer_id,
  p.first_name,
  p.last_name,
  p.email
FROM tracks t
JOIN sample_track st ON t.track_producer_id = st.track_producer_id
LEFT JOIN profiles p ON t.track_producer_id = p.id
WHERE t.deleted_at IS NULL
LIMIT 3;
