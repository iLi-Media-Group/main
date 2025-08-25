-- Create Artist Invitations System
-- This implements the same invitation system as producers but for artists

-- ============================================
-- 1. CREATE ARTIST_INVITATIONS TABLE
-- ============================================

-- Drop the existing table if it exists (to avoid conflicts)
DROP TABLE IF EXISTS artist_invitations CASCADE;

-- Create the artist_invitations table with the correct structure
CREATE TABLE artist_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  artist_number TEXT NOT NULL,
  invitation_code TEXT NOT NULL UNIQUE,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraint to ensure artist_number format (MBAR-01, MBAR-02, etc.)
ALTER TABLE artist_invitations 
ADD CONSTRAINT artist_invitations_artist_number_check 
CHECK (artist_number ~ '^MBAR-\d{2}$');

-- Create indexes for efficient querying
CREATE INDEX idx_artist_invitations_email ON artist_invitations(email);
CREATE INDEX idx_artist_invitations_artist_number ON artist_invitations(artist_number);
CREATE INDEX idx_artist_invitations_invitation_code ON artist_invitations(invitation_code);
CREATE INDEX idx_artist_invitations_created_at ON artist_invitations(created_at);
CREATE INDEX idx_artist_invitations_used ON artist_invitations(used) WHERE NOT used;

-- Enable RLS
ALTER TABLE artist_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. CREATE RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admins to read artist invitations" ON artist_invitations;
DROP POLICY IF EXISTS "Allow admins to insert artist invitations" ON artist_invitations;
DROP POLICY IF EXISTS "Allow admins to update artist invitations" ON artist_invitations;
DROP POLICY IF EXISTS "Allow public read for validation" ON artist_invitations;

-- Create RLS policies for admin access
CREATE POLICY "Allow admins to read artist invitations" ON artist_invitations
  FOR SELECT
  USING (
    (auth.jwt() ->> 'email') IN (
      'knockriobeats@gmail.com',
      'info@mybeatfi.io',
      'derykbanks@yahoo.com',
      'knockriobeats2@gmail.com'
    )
  );

CREATE POLICY "Allow admins to insert artist invitations" ON artist_invitations
  FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'email') IN (
      'knockriobeats@gmail.com',
      'info@mybeatfi.io',
      'derykbanks@yahoo.com',
      'knockriobeats2@gmail.com'
    )
  );

CREATE POLICY "Allow admins to update artist invitations" ON artist_invitations
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'email') IN (
      'knockriobeats@gmail.com',
      'info@mybeatfi.io',
      'derykbanks@yahoo.com',
      'knockriobeats2@gmail.com'
    )
  );

-- Allow public read access for validation (same as producer system)
CREATE POLICY "Allow public read for validation" ON artist_invitations
  FOR SELECT
  TO public
  USING (true);

-- ============================================
-- 3. CREATE VALIDATION FUNCTIONS
-- ============================================

-- Function to validate artist invitation
CREATE OR REPLACE FUNCTION validate_artist_invitation(code text, email_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM artist_invitations
    WHERE invitation_code = validate_artist_invitation.code
    AND (email IS NULL OR email = validate_artist_invitation.email_address)
    AND NOT used
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;

-- Function to mark artist invitation as used
CREATE OR REPLACE FUNCTION use_artist_invitation(code text, email_address text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE artist_invitations
  SET used = TRUE, used_at = NOW()
  WHERE invitation_code = use_artist_invitation.code
  AND (email IS NULL OR email = use_artist_invitation.email_address)
  AND NOT used
  AND (expires_at IS NULL OR expires_at > NOW());
END;
$$;

-- Function to get next available artist number
CREATE OR REPLACE FUNCTION get_next_artist_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_num integer;
  result text;
BEGIN
  -- Get the highest artist number
  SELECT COALESCE(MAX(CAST(SUBSTRING(artist_number FROM 6) AS integer)), 0) + 1
  INTO next_num
  FROM artist_invitations;
  
  -- Format as MBAR-XX
  result := 'MBAR-' || LPAD(next_num::text, 2, '0');
  
  RETURN result;
END;
$$;

-- ============================================
-- 4. GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION validate_artist_invitation(text, text) TO public;
GRANT EXECUTE ON FUNCTION use_artist_invitation(text, text) TO public;
GRANT EXECUTE ON FUNCTION get_next_artist_number() TO authenticated;

-- ============================================
-- 5. ADD ARTIST_NUMBER COLUMN TO PROFILES
-- ============================================

-- Add artist_number column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS artist_number TEXT;

-- Create index on artist_number
CREATE INDEX IF NOT EXISTS idx_profiles_artist_number ON profiles(artist_number);

-- Add constraint to ensure artist_number format
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_artist_number_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_artist_number_check 
CHECK (artist_number IS NULL OR artist_number ~ '^MBAR-\d{2}$');

-- ============================================
-- 6. CREATE TEST DATA (OPTIONAL)
-- ============================================

-- Insert a test artist invitation (uncomment if needed for testing)
-- INSERT INTO artist_invitations (email, first_name, last_name, artist_number, invitation_code, created_by) VALUES
-- ('testartist@mybeatfi.io', 'Test', 'Artist', 'MBAR-01', 'TEST_ARTIST_001', (SELECT id FROM auth.users WHERE email = 'knockriobeats@gmail.com' LIMIT 1));

-- ============================================
-- 7. VERIFICATION QUERIES
-- ============================================

-- Verify the table was created
SELECT 'Artist invitations table created successfully' as status;

-- Show table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'artist_invitations' 
ORDER BY ordinal_position;

-- Test the get_next_artist_number function
SELECT get_next_artist_number() as next_artist_number;
