-- Create service_onboarding_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS service_onboarding_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    service_type TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used BOOLEAN DEFAULT FALSE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_onboarding_tokens_email ON service_onboarding_tokens(email);
CREATE INDEX IF NOT EXISTS idx_service_onboarding_tokens_token ON service_onboarding_tokens(token);
CREATE INDEX IF NOT EXISTS idx_service_onboarding_tokens_expires ON service_onboarding_tokens(expires_at);

-- Enable RLS
ALTER TABLE service_onboarding_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Allow service role access" ON service_onboarding_tokens;
CREATE POLICY "Allow service role access" ON service_onboarding_tokens
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow authenticated users to insert" ON service_onboarding_tokens;
CREATE POLICY "Allow authenticated users to insert" ON service_onboarding_tokens
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow public read for validation" ON service_onboarding_tokens;
CREATE POLICY "Allow public read for validation" ON service_onboarding_tokens
    FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON service_onboarding_tokens TO service_role;
GRANT INSERT, SELECT ON service_onboarding_tokens TO authenticated;
GRANT SELECT ON service_onboarding_tokens TO anon;
