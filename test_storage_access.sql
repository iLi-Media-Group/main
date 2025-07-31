-- Test storage access for the failing file
-- The error shows: yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/sign/track-images/83e21f94-aced-452a-bafb-6eb9629e3b18/FaceTime/cover.jpg

-- Check if the file exists
SELECT 
  name,
  bucket_id,
  owner,
  created_at,
  updated_at
FROM storage.objects 
WHERE name LIKE '%83e21f94-aced-452a-bafb-6eb9629e3b18%'
AND bucket_id = 'track-images';

-- Check the specific file path
SELECT 
  name,
  bucket_id,
  owner,
  created_at,
  updated_at
FROM storage.objects 
WHERE name LIKE '%FaceTime/cover.jpg%'
AND bucket_id = 'track-images';

-- Check user profile
SELECT 
  id,
  email,
  account_type,
  created_at
FROM profiles 
WHERE id = '83e21f94-aced-452a-bafb-6eb9629e3b18';

-- Test if the user can access their own files
SELECT 
  auth.uid() as current_user_id,
  '83e21f94-aced-452a-bafb-6eb9629e3b18' as file_owner_id,
  auth.uid()::text = '83e21f94-aced-452a-bafb-6eb9629e3b18' as is_owner;

-- Check storage bucket permissions
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE name = 'track-images'; 