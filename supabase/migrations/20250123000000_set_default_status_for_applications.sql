-- Set default values for new producer applications
-- This ensures all new applications have proper status and flags

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

-- Add a comment to document the default behavior
COMMENT ON COLUMN producer_applications.status IS 'Default value: new. All new applications should have status = new';
COMMENT ON COLUMN producer_applications.is_auto_rejected IS 'Default value: false. Set to true if application is automatically rejected';
