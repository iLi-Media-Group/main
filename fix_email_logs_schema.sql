-- Add email_type column to email_logs table
ALTER TABLE email_logs 
ADD COLUMN IF NOT EXISTS email_type text;

-- Add comment to document the column purpose
COMMENT ON COLUMN email_logs.email_type IS 'Type of email sent (e.g., password_reset, invitation, welcome, etc.)';

-- Update existing records to have a default email_type if needed
UPDATE email_logs 
SET email_type = 'general' 
WHERE email_type IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'email_logs' 
AND column_name = 'email_type';
