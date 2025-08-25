-- Add missing columns to artist_applications table
-- Run this in Supabase SQL Editor

-- Add sync licensing course column
ALTER TABLE artist_applications 
ADD COLUMN IF NOT EXISTS sync_licensing_course TEXT;

-- Add quiz question columns
ALTER TABLE artist_applications 
ADD COLUMN IF NOT EXISTS quiz_question_1 TEXT;

ALTER TABLE artist_applications 
ADD COLUMN IF NOT EXISTS quiz_question_2 TEXT;

ALTER TABLE artist_applications 
ADD COLUMN IF NOT EXISTS quiz_question_3 TEXT;

ALTER TABLE artist_applications 
ADD COLUMN IF NOT EXISTS quiz_question_4 TEXT;

ALTER TABLE artist_applications 
ADD COLUMN IF NOT EXISTS quiz_question_5 TEXT;

-- Add quiz scoring columns
ALTER TABLE artist_applications 
ADD COLUMN IF NOT EXISTS quiz_score INTEGER DEFAULT 0;

ALTER TABLE artist_applications 
ADD COLUMN IF NOT EXISTS quiz_total_questions INTEGER DEFAULT 5;

ALTER TABLE artist_applications 
ADD COLUMN IF NOT EXISTS quiz_completed BOOLEAN DEFAULT false;

-- Add score breakdown column
ALTER TABLE artist_applications 
ADD COLUMN IF NOT EXISTS score_breakdown JSONB;

-- Verify the columns were added
SELECT 'Updated table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'artist_applications' 
AND column_name IN ('sync_licensing_course', 'quiz_question_1', 'quiz_question_2', 'quiz_question_3', 'quiz_question_4', 'quiz_question_5', 'quiz_score', 'quiz_total_questions', 'quiz_completed', 'score_breakdown')
ORDER BY ordinal_position;

-- Test insert with all columns
SELECT 'Testing insert with all columns:' as info;
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
  'Test Band Complete', 'testbandcomplete@example.com', 'Band', 'Rock', 'Test Band Name Complete',
  'Self', 'Home Studio', 'No', 'Self', 'Self', 'No', '', 'Yes', 'Yes',
  'https://example.com', '10', 'Yes', 'Yes', 'No', 'Yes', 'Test Manager',
  'manager@example.com', '123-456-7890', 'Yes', 'Test additional info',
  'new', 75, 'Yes', 'C', 'B', 'B,C', 'C', 'B', 4, 5, true, '{"basicProfile": 20, "production": 15, "ownership": 25, "catalog": 20, "syncSuitability": 15, "accountManagement": 5}'
) ON CONFLICT DO NOTHING;

-- Verify the insert worked
SELECT 'Final test - total records:' as info;
SELECT COUNT(*) as total_records FROM artist_applications;
