-- Add provider column to email_logs table
-- Run this in Supabase SQL Editor

-- Add provider column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_logs' 
        AND column_name = 'provider'
    ) THEN
        ALTER TABLE email_logs ADD COLUMN provider VARCHAR(50);
    END IF;
END $$;

-- Update existing records to have a default provider
UPDATE email_logs SET provider = 'unknown' WHERE provider IS NULL;

-- Show the updated table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'email_logs' 
ORDER BY ordinal_position;

-- Show recent email logs with provider
SELECT 
  id,
  to_email,
  subject,
  status,
  provider,
  sent_at
FROM email_logs 
ORDER BY sent_at DESC 
LIMIT 10;
