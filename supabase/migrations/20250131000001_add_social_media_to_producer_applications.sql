-- Add social_media column to producer_applications table
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS social_media text;

-- Add comment to document the column purpose
COMMENT ON COLUMN producer_applications.social_media IS 'Social media URL or link where we can hear the producer''s current music';
