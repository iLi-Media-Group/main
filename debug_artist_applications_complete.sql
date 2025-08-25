-- Comprehensive debug for artist_applications 400 error
-- Run this in Supabase SQL Editor

-- 1. Check table structure
SELECT 'Table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'artist_applications' 
ORDER BY ordinal_position;

-- 2. Check all constraints
SELECT 'All constraints:' as info;
SELECT conname, contype, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'artist_applications'::regclass;

-- 3. Check RLS status
SELECT 'RLS status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'artist_applications';

-- 4. List RLS policies
SELECT 'RLS policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'artist_applications';

-- 5. Test a minimal insert to see what fails
SELECT 'Testing minimal insert:' as info;
INSERT INTO artist_applications (
  name, email, artist_type, primary_genre, stage_name, music_producer, 
  production_method, uses_premade_tracks, master_rights_owner, publishing_rights_owner,
  shares_ownership, ownership_explanation, is_one_stop, has_streaming_releases,
  streaming_links, catalog_track_count, has_instrumentals, has_stems,
  has_sync_licenses, understands_rights_requirement, account_manager_name,
  account_manager_email, account_manager_phone, account_manager_authority,
  additional_info, status, application_score, sync_licensing_course,
  quiz_question_1, quiz_question_2, quiz_question_3, quiz_question_4, quiz_question_5,
  quiz_score, quiz_total_questions, quiz_completed, score_breakdown
) VALUES (
  'Test Band', 'testband@example.com', 'Band', 'Rock', 'Test Band Name',
  'Self', 'Home Studio', 'No', 'Self', 'Self', 'No', '', 'Yes', 'Yes',
  'https://example.com', '10', 'Yes', 'Yes', 'No', 'Yes', 'Test Manager',
  'manager@example.com', '123-456-7890', 'Yes', 'Test additional info',
  'new', 75, 'Yes', 'C', 'B', 'B,C', 'C', 'B', 4, 5, true, '{"basicProfile": 20, "production": 15, "ownership": 25, "catalog": 20, "syncSuitability": 15, "accountManagement": 5}'
) ON CONFLICT DO NOTHING;

-- 6. Check if insert was successful
SELECT 'Insert test result - total records:' as info;
SELECT COUNT(*) as total_records FROM artist_applications;

-- 7. Check for any missing columns that might be required
SELECT 'Checking for required columns:' as info;
SELECT column_name, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'artist_applications' 
AND is_nullable = 'NO' 
AND column_default IS NULL
ORDER BY ordinal_position;
