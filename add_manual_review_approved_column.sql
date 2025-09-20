-- Add manual_review_approved column to producer_applications table
-- Run this in Supabase SQL Editor

-- Add the new column
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS manual_review_approved BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN producer_applications.manual_review_approved IS 'Indicates if a manually reviewed auto-rejected application was approved';

-- Update existing auto-rejected applications to have manual_review_approved = false
UPDATE producer_applications 
SET manual_review_approved = false 
WHERE is_auto_rejected = true AND manual_review_approved IS NULL;

-- Verify the column was added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'producer_applications' 
AND column_name = 'manual_review_approved';

-- Show sample data
SELECT 
  id,
  name,
  email,
  status,
  is_auto_rejected,
  manual_review_approved,
  created_at
FROM producer_applications 
WHERE is_auto_rejected = true
LIMIT 5;
