-- Debug Artist Applications in Admin Dashboard
-- Run this in Supabase SQL Editor

-- 1. Check all artist applications and their status
SELECT 'All artist applications:' as info;
SELECT 
  id,
  name,
  email,
  artist_type,
  primary_genre,
  status,
  application_score,
  created_at,
  updated_at
FROM artist_applications
ORDER BY created_at DESC;

-- 2. Count applications by status
SELECT 'Artist applications by status:' as info;
SELECT 
  status,
  COUNT(*) as count
FROM artist_applications
GROUP BY status
ORDER BY count DESC;

-- 3. Check if there are any applications with null status
SELECT 'Applications with null status:' as info;
SELECT 
  id,
  name,
  email,
  status
FROM artist_applications
WHERE status IS NULL;

-- 4. Check the most recent applications
SELECT 'Most recent 5 artist applications:' as info;
SELECT 
  id,
  name,
  email,
  artist_type,
  status,
  created_at
FROM artist_applications
ORDER BY created_at DESC
LIMIT 5;

-- 5. Compare with producer applications
SELECT 'Producer applications by status:' as info;
SELECT 
  status,
  COUNT(*) as count
FROM producer_applications
GROUP BY status
ORDER BY count DESC;

-- 6. Check total counts
SELECT 'Total application counts:' as info;
SELECT 
  'artist_applications' as table_name,
  COUNT(*) as total_count
FROM artist_applications
UNION ALL
SELECT 
  'producer_applications' as table_name,
  COUNT(*) as total_count
FROM producer_applications;
