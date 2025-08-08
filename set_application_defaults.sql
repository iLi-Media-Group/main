-- Set default values for producer applications
-- Run this in Supabase SQL Editor to ensure new applications have proper status

-- Add default values for status and is_auto_rejected
ALTER TABLE producer_applications 
ALTER COLUMN status SET DEFAULT 'new';

ALTER TABLE producer_applications 
ALTER COLUMN is_auto_rejected SET DEFAULT false;

-- Update any existing applications that don't have a status
UPDATE producer_applications 
SET status = 'new'
WHERE status IS NULL;

-- Update any existing applications that don't have is_auto_rejected set
UPDATE producer_applications 
SET is_auto_rejected = false
WHERE is_auto_rejected IS NULL;

-- Verify the changes
SELECT 
    column_name,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'producer_applications' 
  AND column_name IN ('status', 'is_auto_rejected');
