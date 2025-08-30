-- Create Producer 3 Test Account
-- Copy and paste this into your Supabase SQL Editor

-- Insert the third test producer invitation code
INSERT INTO producer_invitations (invitation_code, email, first_name, last_name, created_by) VALUES
('TEST_PRODUCER_003', 'testproducer3@mybeatfi.io', 'Test', 'Producer3', (SELECT id FROM auth.users WHERE email = 'knockriobeats@gmail.com' LIMIT 1))
ON CONFLICT (invitation_code) DO NOTHING;

-- Verify the code was created
SELECT * FROM producer_invitations WHERE invitation_code = 'TEST_PRODUCER_003'; 