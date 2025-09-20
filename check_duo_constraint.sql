-- Check and fix Duo/duo constraint issue
-- Run this in Supabase SQL Editor

-- 1. Check the current constraint
SELECT 'Current artist_type constraint:' as info;
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'artist_applications'::regclass 
AND conname = 'artist_applications_artist_type_check';

-- 2. Test what values are currently allowed
SELECT 'Testing current constraint with different values:' as info;

-- Test with 'Duo' (what the form sends)
SELECT 'Testing "Duo":' as test_value;
INSERT INTO artist_applications (
  name, email, artist_type, primary_genre, stage_name, music_producer, 
  production_method, uses_premade_tracks, master_rights_owner, publishing_rights_owner,
  shares_ownership, ownership_explanation, is_one_stop, has_streaming_releases,
  streaming_links, catalog_track_count, has_instrumentals, has_stems,
  has_sync_licenses, understands_rights_requirement, account_manager_name,
  account_manager_email, account_manager_phone, account_manager_authority,
  additional_info, status, application_score
) VALUES (
  'Test Duo Artist', 'testduo@example.com', 'Duo', 'Pop', 'Test Duo Name',
  'Self', 'Home Studio', 'No', 'Self', 'Self', 'No', '', 'Yes', 'Yes',
  'https://example.com', '10', 'Yes', 'Yes', 'No', 'Yes', 'Test Manager',
  'manager@example.com', '123-456-7890', 'Yes', 'Test additional info',
  'new', 75
) ON CONFLICT DO NOTHING;

-- 3. Drop the current constraint
ALTER TABLE artist_applications DROP CONSTRAINT IF EXISTS artist_applications_artist_type_check;

-- 4. Add a new constraint that allows both formats
ALTER TABLE artist_applications ADD CONSTRAINT artist_applications_artist_type_check 
CHECK (artist_type IN ('Solo Artist', 'Duo', 'Band', 'solo artist', 'duo', 'band'));

-- 5. Test the new constraint
SELECT 'Testing new constraint with "Duo":' as info;
INSERT INTO artist_applications (
  name, email, artist_type, primary_genre, stage_name, music_producer, 
  production_method, uses_premade_tracks, master_rights_owner, publishing_rights_owner,
  shares_ownership, ownership_explanation, is_one_stop, has_streaming_releases,
  streaming_links, catalog_track_count, has_instrumentals, has_stems,
  has_sync_licenses, understands_rights_requirement, account_manager_name,
  account_manager_email, account_manager_phone, account_manager_authority,
  additional_info, status, application_score
) VALUES (
  'Test Duo Artist 2', 'testduo2@example.com', 'Duo', 'Pop', 'Test Duo Name 2',
  'Self', 'Home Studio', 'No', 'Self', 'Self', 'No', '', 'Yes', 'Yes',
  'https://example.com', '10', 'Yes', 'Yes', 'No', 'Yes', 'Test Manager',
  'manager@example.com', '123-456-7890', 'Yes', 'Test additional info',
  'new', 75
) ON CONFLICT DO NOTHING;

-- 6. Verify the constraint works
SELECT 'Constraint test successful - total records:' as info;
SELECT COUNT(*) as total_records FROM artist_applications;
