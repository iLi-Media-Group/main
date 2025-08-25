-- Create producer_invitation_logs table for tracking sent invitations
CREATE TABLE IF NOT EXISTS producer_invitation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  producer_number TEXT NOT NULL,
  invitation_code TEXT NOT NULL,
  email_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_producer_invitation_logs_email ON producer_invitation_logs(email);
CREATE INDEX IF NOT EXISTS idx_producer_invitation_logs_producer_number ON producer_invitation_logs(producer_number);
CREATE INDEX IF NOT EXISTS idx_producer_invitation_logs_sent_at ON producer_invitation_logs(sent_at);

-- Add RLS policies
ALTER TABLE producer_invitation_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all logs
CREATE POLICY "Allow admins to read invitation logs" ON producer_invitation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type LIKE '%admin%'
    )
  );

-- Allow admins to insert logs
CREATE POLICY "Allow admins to insert invitation logs" ON producer_invitation_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type LIKE '%admin%'
    )
  );

-- Verify the table structure
SELECT 'Producer invitation logs table created:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'producer_invitation_logs'
ORDER BY ordinal_position; 