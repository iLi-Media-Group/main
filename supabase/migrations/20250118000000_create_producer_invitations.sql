-- Migration: Create producer invitations system
-- This sets up the table and functions needed for producer invitation codes

-- Create the producer_invitations table
CREATE TABLE IF NOT EXISTS producer_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invitation_code TEXT UNIQUE NOT NULL,
    email_address TEXT,
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

CREATE INDEX idx_producer_invitations_email ON producer_invitations(email_address);
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
        AND (email_address IS NULL OR email_address = validate_producer_invitation.email_address)
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
    AND (email_address IS NULL OR email_address = use_producer_invitation.email_address)
    AND NOT used;
END;
$$; 