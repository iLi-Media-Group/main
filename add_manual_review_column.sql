-- Add manual_review column to producer_applications table
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS manual_review BOOLEAN DEFAULT false;

COMMENT ON COLUMN producer_applications.manual_review IS 'Indicates if an application is in manual review status';

-- Update existing auto-rejected applications to have manual_review = false
UPDATE producer_applications 
SET manual_review = false 
WHERE is_auto_rejected = true AND manual_review IS NULL;

-- Update applications with status 'manual_review' to have manual_review = true
UPDATE producer_applications 
SET manual_review = true 
WHERE status = 'manual_review';
