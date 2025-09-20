-- Check Artist Invitations System
-- Run this in Supabase SQL Editor to diagnose the "invalid or expired artist invitation code" error

-- ============================================
-- 1. CHECK IF ARTIST_INVITATIONS TABLE EXISTS
-- ============================================

SELECT 'Checking if artist_invitations table exists:' as step;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'artist_invitations'
) as table_exists;

-- ============================================
-- 2. CHECK TABLE STRUCTURE
-- ============================================

SELECT 'Artist invitations table structure:' as step;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'artist_invitations'
ORDER BY ordinal_position;

-- ============================================
-- 3. CHECK RLS POLICIES
-- ============================================

SELECT 'RLS policies for artist_invitations:' as step;
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'artist_invitations';

-- ============================================
-- 4. CHECK IF VALIDATION FUNCTION EXISTS
-- ============================================

SELECT 'Checking if validate_artist_invitation function exists:' as step;
SELECT 
    proname as function_name,
    proargtypes::regtype[] as parameter_types,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'validate_artist_invitation';

-- ============================================
-- 5. CHECK EXISTING ARTIST INVITATIONS
-- ============================================

SELECT 'Existing artist invitations:' as step;
SELECT 
    id,
    email,
    first_name,
    last_name,
    artist_number,
    invitation_code,
    used,
    created_at,
    expires_at,
    CASE 
        WHEN used = TRUE THEN 'Already used'
        WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'Expired'
        ELSE 'Valid'
    END as status
FROM artist_invitations 
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 6. TEST THE VALIDATION FUNCTION
-- ============================================

SELECT 'Testing validate_artist_invitation function:' as step;
-- Test with a real invitation code if one exists
SELECT 
    invitation_code,
    email,
    validate_artist_invitation(invitation_code, email) as is_valid
FROM artist_invitations 
WHERE used = FALSE 
AND (expires_at IS NULL OR expires_at > NOW())
LIMIT 5;

-- ============================================
-- 7. CHECK PERMISSIONS
-- ============================================

SELECT 'Checking function permissions:' as step;
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name = 'validate_artist_invitation';

-- ============================================
-- 8. CREATE MISSING SYSTEM IF NEEDED
-- ============================================

-- If the table doesn't exist, create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'artist_invitations'
    ) THEN
        RAISE NOTICE 'Creating artist_invitations table...';
        
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

        -- Add constraint to ensure artist_number format
        ALTER TABLE artist_invitations 
        ADD CONSTRAINT artist_invitations_artist_number_check 
        CHECK (artist_number ~ '^MBAR-\d{2}$');

        -- Create indexes
        CREATE INDEX idx_artist_invitations_email ON artist_invitations(email);
        CREATE INDEX idx_artist_invitations_artist_number ON artist_invitations(artist_number);
        CREATE INDEX idx_artist_invitations_invitation_code ON artist_invitations(invitation_code);
        CREATE INDEX idx_artist_invitations_created_at ON artist_invitations(created_at);
        CREATE INDEX idx_artist_invitations_used ON artist_invitations(used) WHERE NOT used;

        -- Enable RLS
        ALTER TABLE artist_invitations ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
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

        -- Allow public read access for validation
        CREATE POLICY "Allow public read for validation" ON artist_invitations
            FOR SELECT
            TO public
            USING (true);

        RAISE NOTICE 'Artist invitations table created successfully';
    ELSE
        RAISE NOTICE 'Artist invitations table already exists';
    END IF;
END $$;

-- Create validation function if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_proc WHERE proname = 'validate_artist_invitation'
    ) THEN
        RAISE NOTICE 'Creating validate_artist_invitation function...';
        
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

        -- Grant execute permissions
        GRANT EXECUTE ON FUNCTION validate_artist_invitation(text, text) TO public;
        
        RAISE NOTICE 'validate_artist_invitation function created successfully';
    ELSE
        RAISE NOTICE 'validate_artist_invitation function already exists';
    END IF;
END $$;

-- Create use function if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_proc WHERE proname = 'use_artist_invitation'
    ) THEN
        RAISE NOTICE 'Creating use_artist_invitation function...';
        
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

        -- Grant execute permissions
        GRANT EXECUTE ON FUNCTION use_artist_invitation(text, text) TO public;
        
        RAISE NOTICE 'use_artist_invitation function created successfully';
    ELSE
        RAISE NOTICE 'use_artist_invitation function already exists';
    END IF;
END $$;

-- Create get_next_artist_number function if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_proc WHERE proname = 'get_next_artist_number'
    ) THEN
        RAISE NOTICE 'Creating get_next_artist_number function...';
        
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

        -- Grant execute permissions
        GRANT EXECUTE ON FUNCTION get_next_artist_number() TO authenticated;
        
        RAISE NOTICE 'get_next_artist_number function created successfully';
    ELSE
        RAISE NOTICE 'get_next_artist_number function already exists';
    END IF;
END $$;

-- Add artist_number column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'artist_number'
    ) THEN
        RAISE NOTICE 'Adding artist_number column to profiles table...';
        
        ALTER TABLE profiles ADD COLUMN artist_number TEXT;
        CREATE INDEX idx_profiles_artist_number ON profiles(artist_number);
        ALTER TABLE profiles ADD CONSTRAINT profiles_artist_number_check 
        CHECK (artist_number IS NULL OR artist_number ~ '^MBAR-\d{2}$');
        
        RAISE NOTICE 'artist_number column added to profiles table';
    ELSE
        RAISE NOTICE 'artist_number column already exists in profiles table';
    END IF;
END $$;

-- ============================================
-- 9. FINAL VERIFICATION
-- ============================================

SELECT 'Final verification - testing the system:' as step;

-- Test get_next_artist_number function
SELECT get_next_artist_number() as next_artist_number;

-- Show final table structure
SELECT 'Final artist_invitations table structure:' as step;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'artist_invitations'
ORDER BY ordinal_position;

-- Show any existing invitations
SELECT 'Final artist invitations data:' as step;
SELECT 
    id,
    email,
    first_name,
    last_name,
    artist_number,
    invitation_code,
    used,
    created_at,
    expires_at
FROM artist_invitations 
ORDER BY created_at DESC
LIMIT 5;
