-- Check and fix artist_type constraint
-- Run this in Supabase SQL Editor

-- 1. Check the current constraint
SELECT 'Current artist_type constraint:' as info;
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'artist_applications'::regclass 
AND conname = 'artist_applications_artist_type_check';

-- 2. Show all check constraints on the table
SELECT 'All check constraints on artist_applications:' as info;
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'artist_applications'::regclass 
AND contype = 'c';

-- 3. Drop the problematic constraint
ALTER TABLE artist_applications DROP CONSTRAINT IF EXISTS artist_applications_artist_type_check;

-- 4. Add a new constraint that allows the values we need
ALTER TABLE artist_applications ADD CONSTRAINT artist_applications_artist_type_check 
CHECK (artist_type IN ('Solo Artist', 'Duo', 'Band', 'Solo artist', 'Duo', 'Band'));

-- 5. Test the insert again
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

-- 6. Verify the insert worked
SELECT 'After fix - record count:' as info;
SELECT COUNT(*) as total_records FROM artist_applications;
