-- Debug Artist Applications Table
-- Run this in Supabase SQL Editor to check the current state

-- 1. Check if table exists and its structure
SELECT 'Table exists check:' as info;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'artist_applications'
) as table_exists;

-- 2. Show table structure
SELECT 'Table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'artist_applications' 
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT 'RLS status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'artist_applications';

-- 4. List all RLS policies
SELECT 'RLS policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'artist_applications';

-- 5. Check if there are any existing records
SELECT 'Record count:' as info;
SELECT COUNT(*) as total_records FROM artist_applications;

-- 6. Test insert permissions (this will show if RLS is blocking inserts)
SELECT 'Testing insert permissions...' as info;
-- Note: This will fail if RLS is blocking, but that's what we want to see
INSERT INTO artist_applications (
  name, email, artist_type, primary_genre, stage_name, music_producer, 
  production_method, uses_premade_tracks, master_rights_owner, publishing_rights_owner,
  shares_ownership, ownership_explanation, is_one_stop, has_streaming_releases,
  streaming_links, catalog_track_count, has_instrumentals, has_stems,
  has_sync_licenses, understands_rights_requirement, account_manager_name,
  account_manager_email, account_manager_phone, account_manager_authority,
  additional_info, status, application_score
) VALUES (
  'Test Artist', 'test@example.com', 'Solo Artist', 'Pop', 'Test Stage Name',
  'Self', 'Home Studio', 'No', 'Self', 'Self', 'No', '', 'Yes', 'Yes',
  'https://example.com', '10', 'Yes', 'Yes', 'No', 'Yes', 'Test Manager',
  'manager@example.com', '123-456-7890', 'Yes', 'Test additional info',
  'new', 75
) ON CONFLICT DO NOTHING;

-- 7. Check if the insert worked
SELECT 'After insert test:' as info;
SELECT COUNT(*) as total_records_after FROM artist_applications;
