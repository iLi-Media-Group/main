-- Add quiz columns to producer_applications table
-- Run this in Supabase SQL Editor to add missing columns

-- Add quiz question columns
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS quiz_question_1 TEXT,
ADD COLUMN IF NOT EXISTS quiz_question_2 TEXT,
ADD COLUMN IF NOT EXISTS quiz_question_3 TEXT,
ADD COLUMN IF NOT EXISTS quiz_question_4 TEXT,
ADD COLUMN IF NOT EXISTS quiz_question_5 TEXT;

-- Add quiz score and completion tracking
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS quiz_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quiz_total_questions INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS quiz_completed BOOLEAN DEFAULT FALSE;

-- Add new instrument fields
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS instrument_one TEXT,
ADD COLUMN IF NOT EXISTS instrument_one_proficiency TEXT,
ADD COLUMN IF NOT EXISTS instrument_two TEXT,
ADD COLUMN IF NOT EXISTS instrument_two_proficiency TEXT,
ADD COLUMN IF NOT EXISTS instrument_three TEXT,
ADD COLUMN IF NOT EXISTS instrument_three_proficiency TEXT,
ADD COLUMN IF NOT EXISTS instrument_four TEXT,
ADD COLUMN IF NOT EXISTS instrument_four_proficiency TEXT;

-- Add recording artists fields
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS records_artists TEXT,
ADD COLUMN IF NOT EXISTS artist_example_link TEXT;

-- Add sync licensing course field
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS sync_licensing_course TEXT;

-- Add AI generated music field
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS ai_generated_music TEXT;

-- Add sample use field
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS sample_use TEXT;

-- Add loop use field
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS loop_use TEXT;

-- Add splice use field
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS splice_use TEXT;

-- Add business entity field
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS business_entity TEXT;

-- Add pro affiliation field
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS pro_affiliation TEXT;

-- Add additional info field
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS additional_info TEXT;

-- Add status and review fields
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS review_tier TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_producer_applications_status ON producer_applications(status);
CREATE INDEX IF NOT EXISTS idx_producer_applications_quiz_score ON producer_applications(quiz_score);
CREATE INDEX IF NOT EXISTS idx_producer_applications_created_at ON producer_applications(created_at);
