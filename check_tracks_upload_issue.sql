-- Check tracks table upload issue
-- This script will help identify what's causing the 400 error during track upload

-- 1. Check if tracks table exists and its structure
SELECT 'Checking tracks table structure...' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' 
ORDER BY ordinal_position;

-- 2. Check RLS status on tracks table
SELECT 'Checking RLS status...' as info;

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'tracks';

-- 3. Check RLS policies on tracks table
SELECT 'Checking RLS policies...' as info;

SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tracks'
ORDER BY policyname;

-- 4. Check if there are any constraints that might cause issues
SELECT 'Checking constraints...' as info;

SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'tracks'::regclass;

-- 5. Check if there are any triggers that might interfere
SELECT 'Checking triggers...' as info;

SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'tracks';

-- 6. Check recent data in tracks table to see structure
SELECT 'Checking recent tracks data...' as info;

SELECT 
  id,
  title,
  track_producer_id,
  created_at,
  updated_at
FROM tracks 
ORDER BY created_at DESC 
LIMIT 5;
