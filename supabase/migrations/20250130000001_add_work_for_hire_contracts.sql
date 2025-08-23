-- Add work_for_hire_contracts column to tracks table
-- This column will store an array of URLs to work for hire contract PDFs

ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS work_for_hire_contracts TEXT[] DEFAULT '{}';

-- Add comment to document the column
COMMENT ON COLUMN tracks.work_for_hire_contracts IS 'Array of URLs to work for hire contract PDF files. Maximum 4 contracts per track.';

-- Create bucket for work for hire contracts if it doesn't exist
-- Note: This is handled by the storage policy, but we document it here
-- Bucket name: work-for-hire-contracts
