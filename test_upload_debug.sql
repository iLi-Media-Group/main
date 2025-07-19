-- Test script to verify track-audio bucket configuration and permissions

-- 1. Check bucket exists and is properly configured
SELECT 
  'BUCKET_EXISTS' as test,
  CASE 
    WHEN COUNT(*) > 0 THEN 'PASS' 
    ELSE 'FAIL' 
  END as result,
  COUNT(*) as bucket_count
FROM storage.buckets 
WHERE id = 'track-audio';

-- 2. Check bucket configuration
SELECT 
  'BUCKET_CONFIG' as test,
  CASE 
    WHEN public = false AND file_size_limit = 52428800 THEN 'PASS'
    ELSE 'FAIL'
  END as result,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'track-audio';

-- 3. Check if there are any existing files in the bucket
SELECT 
  'EXISTING_FILES' as test,
  COUNT(*) as file_count,
  CASE 
    WHEN COUNT(*) >= 0 THEN 'PASS'
    ELSE 'FAIL'
  END as result
FROM storage.objects 
WHERE bucket_id = 'track-audio';

-- 4. Check RLS policies on storage.objects for track-audio bucket
SELECT 
  'RLS_POLICIES' as test,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND qual LIKE '%track-audio%';

-- 5. Show all storage policies for reference
SELECT 
  'ALL_STORAGE_POLICIES' as test,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname; 