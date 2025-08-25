-- Add Sync Licensing Course and Quiz Fields to producer_applications
-- This adds fields to track sync licensing knowledge and quiz performance

-- Add the sync licensing course question
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS sync_licensing_course text;

-- Add quiz answer fields
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS quiz_question_1 text,
ADD COLUMN IF NOT EXISTS quiz_question_2 text,
ADD COLUMN IF NOT EXISTS quiz_question_3 text,
ADD COLUMN IF NOT EXISTS quiz_question_4 text,
ADD COLUMN IF NOT EXISTS quiz_question_5 text;

-- Add quiz score tracking
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS quiz_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS quiz_total_questions integer DEFAULT 5;

-- Add quiz completion status
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS quiz_completed boolean DEFAULT false;

-- Verify the new columns
SELECT 'New columns added:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
AND column_name IN (
    'sync_licensing_course',
    'quiz_question_1',
    'quiz_question_2', 
    'quiz_question_3',
    'quiz_question_4',
    'quiz_question_5',
    'quiz_score',
    'quiz_total_questions',
    'quiz_completed'
)
ORDER BY column_name;

-- Show the complete table structure
SELECT 'Complete table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
ORDER BY ordinal_position; 