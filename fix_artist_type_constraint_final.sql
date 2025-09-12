-- Fix artist_type constraint to match form values exactly
-- Run this in Supabase SQL Editor

-- Drop the current constraint
ALTER TABLE artist_applications DROP CONSTRAINT IF EXISTS artist_applications_artist_type_check;

-- Add the correct constraint that matches the form values
ALTER TABLE artist_applications ADD CONSTRAINT artist_applications_artist_type_check 
CHECK (artist_type IN ('Solo Artist', 'Duo', 'Band'));

-- Test with the exact values the form will send
INSERT INTO artist_applications (
  name, email, artist_type, primary_genre, stage_name, music_producer, 
  production_method, uses_premade_tracks, master_rights_owner, publishing_rights_owner,
  shares_ownership, ownership_explanation, is_one_stop, has_streaming_releases,
  streaming_links, catalog_track_count, has_instrumentals, has_stems,
  has_sync_licenses, understands_rights_requirement, account_manager_name,
  account_manager_email, account_manager_phone, account_manager_authority,
  additional_info, status, application_score
) VALUES (
  'Test Artist 2', 'test2@example.com', 'Solo Artist', 'Pop', 'Test Stage Name',
  'Self', 'Home Studio', 'No', 'Self', 'Self', 'No', '', 'Yes', 'Yes',
  'https://example.com', '10', 'Yes', 'Yes', 'No', 'Yes', 'Test Manager',
  'manager@example.com', '123-456-7890', 'Yes', 'Test additional info',
  'new', 75
) ON CONFLICT DO NOTHING;

-- Verify the constraint works
SELECT 'Constraint test successful - record count:' as info;
SELECT COUNT(*) as total_records FROM artist_applications;
