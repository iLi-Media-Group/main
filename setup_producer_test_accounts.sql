-- Setup Producer Test Accounts
-- Copy and paste this entire script into your Supabase SQL Editor

-- First, let's check if the producer_invitations table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'producer_invitations'
);

-- If the table doesn't exist, create it
CREATE TABLE IF NOT EXISTS producer_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invitation_code TEXT UNIQUE NOT NULL,
    email TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE producer_invitations ENABLE ROW LEVEL SECURITY;

-- Create indexes
DROP INDEX IF EXISTS idx_producer_invitations_email;
DROP INDEX IF EXISTS idx_producer_invitations_code;
DROP INDEX IF EXISTS idx_producer_invitations_used;

CREATE INDEX idx_producer_invitations_email ON producer_invitations(email);
CREATE INDEX idx_producer_invitations_code ON producer_invitations(invitation_code);
CREATE INDEX idx_producer_invitations_used ON producer_invitations(used) WHERE NOT used;

-- RLS Policies
DROP POLICY IF EXISTS "Admins can manage producer invitations" ON producer_invitations;
CREATE POLICY "Admins can manage producer invitations"
    ON producer_invitations
    FOR ALL
    USING (
        (auth.jwt() ->> 'email') IN (
            'knockriobeats@gmail.com',
            'info@mybeatfi.io',
            'derykbanks@yahoo.com',
            'knockriobeats2@gmail.com'
        )
    );

-- Function to validate producer invitations
CREATE OR REPLACE FUNCTION validate_producer_invitation(code text, email_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM producer_invitations
        WHERE invitation_code = code
        AND (email IS NULL OR email = validate_producer_invitation.email_address)
        AND NOT used
    );
END;
$$;

-- Function to mark invitation as used
CREATE OR REPLACE FUNCTION use_producer_invitation(code text, email_address text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE producer_invitations
    SET used = TRUE, used_at = NOW()
    WHERE invitation_code = code
    AND (email IS NULL OR email = use_producer_invitation.email_address)
    AND NOT used;
END;
$$;

-- Insert test producer invitation codes
INSERT INTO producer_invitations (invitation_code, email, first_name, last_name, created_by) VALUES
('TEST_PRODUCER_001', 'testproducer1@mybeatfi.io', 'Test', 'Producer1', (SELECT id FROM auth.users WHERE email = 'knockriobeats@gmail.com' LIMIT 1)),
('TEST_PRODUCER_002', 'testproducer2@mybeatfi.io', 'Test', 'Producer2', (SELECT id FROM auth.users WHERE email = 'knockriobeats@gmail.com' LIMIT 1))
ON CONFLICT (invitation_code) DO NOTHING;

-- Verify the codes were created
SELECT * FROM producer_invitations WHERE invitation_code LIKE 'TEST_PRODUCER_%'; 