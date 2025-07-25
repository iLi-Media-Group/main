-- Create producer invitation codes for test accounts
-- Run this in your Supabase SQL editor

-- First, let's check if the producer_invitations table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'producer_invitations'
);

-- If the table doesn't exist, create it
CREATE TABLE IF NOT EXISTS producer_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    email_address TEXT,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id)
);

-- Insert test producer invitation codes
INSERT INTO producer_invitations (invitation_code, email, created_by) VALUES
('TEST_PRODUCER_001', 'testproducer1@mybeatfi.io', (SELECT id FROM auth.users WHERE email = 'knockriobeats@gmail.com' LIMIT 1)),
('TEST_PRODUCER_002', 'testproducer2@mybeatfi.io', (SELECT id FROM auth.users WHERE email = 'knockriobeats@gmail.com' LIMIT 1))
ON CONFLICT (invitation_code) DO NOTHING;

-- Verify the codes were created
SELECT * FROM producer_invitations WHERE code LIKE 'TEST_PRODUCER_%'; 