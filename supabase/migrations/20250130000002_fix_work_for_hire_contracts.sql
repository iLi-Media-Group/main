-- Fix work_for_hire_contracts column in tracks table
-- This migration ensures the column exists and has the correct type

-- Drop the column if it exists with wrong type (safety measure)
ALTER TABLE tracks DROP COLUMN IF EXISTS work_for_hire_contracts;

-- Add the column with correct type
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS work_for_hire_contracts TEXT[] DEFAULT '{}';

-- Add comment to document the column
COMMENT ON COLUMN tracks.work_for_hire_contracts IS 'Array of URLs to work for hire contract PDF files. Maximum 4 contracts per track.';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tracks_work_for_hire_contracts ON tracks USING GIN (work_for_hire_contracts);
