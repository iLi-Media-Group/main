-- Add favorited column to sync_submissions table
-- This is a much simpler approach than using a separate favorites table

-- Add the favorited column
ALTER TABLE sync_submissions 
ADD COLUMN IF NOT EXISTS favorited BOOLEAN DEFAULT false;

-- Add a comment to explain the column
COMMENT ON COLUMN sync_submissions.favorited IS 'Whether this submission has been favorited by the client';

-- Create an index for efficient queries
CREATE INDEX IF NOT EXISTS idx_sync_submissions_favorited ON sync_submissions(favorited);

-- Update existing submissions to have favorited = false if not set
UPDATE sync_submissions 
SET favorited = false 
WHERE favorited IS NULL;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sync_submissions' 
AND column_name = 'favorited';
