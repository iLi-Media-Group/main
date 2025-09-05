-- Check what artist numbers already exist to see the format
SELECT 
  artist_number,
  created_at
FROM artist_invitations 
ORDER BY created_at DESC 
LIMIT 10;

-- Check the current constraint definition
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'artist_invitations'::regclass 
  AND contype = 'c'
  AND conname = 'artist_invitations_artist_number_check';

-- Test the get_next_artist_number function to see what format it returns
SELECT get_next_artist_number() as next_artist_number;

-- First, let's see what format the existing data is in
SELECT DISTINCT artist_number FROM artist_invitations WHERE artist_number IS NOT NULL;

-- If there are existing rows, we need to either:
-- 1. Update them to match the new format, or
-- 2. Make the constraint more flexible

-- Let's make the constraint more flexible to allow both formats
ALTER TABLE artist_invitations DROP CONSTRAINT IF EXISTS artist_invitations_artist_number_check;

-- Add a more flexible constraint that allows both old and new formats
ALTER TABLE artist_invitations ADD CONSTRAINT artist_invitations_artist_number_check 
  CHECK (artist_number ~ '^(MBAR|mbfar)-[0-9]+$');

-- Test insert again
INSERT INTO artist_invitations (
  email, 
  first_name, 
  last_name, 
  invitation_code, 
  artist_number
) VALUES (
  'test@example.com',
  'Test',
  'Artist',
  'testcode456',
  'MBAR-102'
);

-- Check if the insert worked
SELECT * FROM artist_invitations WHERE email = 'test@example.com';

-- Clean up the test data
DELETE FROM artist_invitations WHERE email = 'test@example.com';
