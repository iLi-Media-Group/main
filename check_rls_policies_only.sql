-- Check RLS Policies Only
SELECT '=== TRACKS TABLE RLS POLICIES ===' as section;
SELECT policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'tracks' ORDER BY policyname;

SELECT '=== PROFILES TABLE RLS POLICIES ===' as section;
SELECT policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'profiles' ORDER BY policyname;

SELECT '=== RLS STATUS ===' as section;
SELECT tablename, rowsecurity as rls_enabled FROM pg_tables WHERE tablename IN ('tracks', 'profiles') ORDER BY tablename;

-- ============================================
-- INVESTIGATE TRACK DURATION ISSUE
-- ============================================

SELECT '=== TRACKS TABLE SCHEMA ===' as section;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' 
  AND column_name = 'duration'
ORDER BY column_name;

SELECT '=== SAMPLE TRACK DURATIONS ===' as section;
SELECT 
  id,
  title,
  duration,
  audio_url,
  created_at,
  updated_at
FROM tracks 
WHERE audio_url IS NOT NULL 
  AND audio_url != ''
ORDER BY updated_at DESC 
LIMIT 10;

SELECT '=== TRACKS WITH DEFAULT DURATION ===' as section;
SELECT 
  id,
  title,
  duration,
  audio_url,
  updated_at
FROM tracks 
WHERE duration = '3:30' 
  OR duration = '0:00'
  OR duration IS NULL
ORDER BY updated_at DESC 
LIMIT 10;

SELECT '=== TRACKS WITH VALID DURATIONS ===' as section;
SELECT 
  id,
  title,
  duration,
  audio_url,
  updated_at
FROM tracks 
WHERE duration IS NOT NULL 
  AND duration != '3:30' 
  AND duration != '0:00'
ORDER BY updated_at DESC 
LIMIT 10;

SELECT '=== DURATION FORMAT ANALYSIS ===' as section;
SELECT 
  duration,
  COUNT(*) as count,
  CASE 
    WHEN duration IS NULL THEN 'NULL'
    WHEN duration = '3:30' THEN 'Default 3:30'
    WHEN duration = '0:00' THEN 'Default 0:00'
    WHEN EXTRACT(EPOCH FROM duration) < 3600 THEN 'Less than 1 hour'
    WHEN EXTRACT(EPOCH FROM duration) >= 3600 THEN '1 hour or more'
    ELSE 'Other interval'
  END as format_type,
  EXTRACT(EPOCH FROM duration) as duration_seconds
FROM tracks 
WHERE duration IS NOT NULL
GROUP BY duration
ORDER BY count DESC
LIMIT 20;
