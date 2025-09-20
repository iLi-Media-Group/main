-- Check Report Covers Bucket Status
-- This script diagnoses the current state of the report-covers bucket

-- Check if the bucket exists and its configuration
SELECT '=== REPORT COVERS BUCKET STATUS ===' as info;
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets 
WHERE id = 'report-covers';

-- Check if there are any files in the bucket
SELECT '=== FILES IN REPORT COVERS BUCKET ===' as info;
SELECT 
  name,
  bucket_id,
  created_at,
  updated_at,
  last_accessed_at
FROM storage.objects 
WHERE bucket_id = 'report-covers'
ORDER BY created_at DESC;

-- Check RLS policies for the report-covers bucket
SELECT '=== RLS POLICIES FOR REPORT COVERS ===' as info;
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%report%'
ORDER BY policyname;

-- Check if there are any policies that might be blocking access
SELECT '=== ALL STORAGE OBJECT POLICIES ===' as info;
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
ORDER BY policyname;

-- Test if we can list files in the bucket (this will show any access issues)
SELECT '=== TESTING BUCKET ACCESS ===' as info;
SELECT 
  'Bucket exists:' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'report-covers') 
    THEN 'YES' 
    ELSE 'NO' 
  END as result
UNION ALL
SELECT 
  'Bucket is public:' as test,
  CASE 
    WHEN (SELECT public FROM storage.buckets WHERE id = 'report-covers') = true
    THEN 'YES' 
    ELSE 'NO' 
  END as result
UNION ALL
SELECT 
  'Has RLS policies:' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%report%')
    THEN 'YES' 
    ELSE 'NO' 
  END as result; 