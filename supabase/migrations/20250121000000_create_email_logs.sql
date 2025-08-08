-- Create email_logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- RLS Policies - Only admins can view email logs
CREATE POLICY "Admins can view email logs" ON email_logs
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "Service role can insert email logs" ON email_logs
    FOR INSERT WITH CHECK (true);
