-- Fix Artist Number Constraint
-- This script will fix the constraint error for artist numbers
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CHECK CURRENT CONSTRAINT
-- ============================================

SELECT 'Current artist number constraint:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'artist_invitations'::regclass 
AND conname = 'artist_invitations_artist_number_check';

-- ============================================
-- 2. DROP AND RECREATE CONSTRAINT
-- ============================================

-- Drop the existing constraint
ALTER TABLE artist_invitations 
DROP CONSTRAINT IF EXISTS artist_invitations_artist_number_check;

-- Create new constraint that allows 2-3 digit numbers
ALTER TABLE artist_invitations 
ADD CONSTRAINT artist_invitations_artist_number_check 
CHECK (artist_number ~ '^MBAR-\d{2,3}$');

-- ============================================
-- 3. UPDATE PROFILES CONSTRAINT TOO
-- ============================================

-- Drop the existing constraint on profiles table
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_artist_number_check;

-- Create new constraint on profiles table
ALTER TABLE profiles 
ADD CONSTRAINT profiles_artist_number_check 
CHECK (artist_number IS NULL OR artist_number ~ '^MBAR-\d{2,3}$');

-- ============================================
-- 4. UPDATE GET_NEXT_ARTIST_NUMBER FUNCTION
-- ============================================

-- Update the function to handle 3-digit numbers
DROP FUNCTION IF EXISTS get_next_artist_number();
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
  
  -- Format as MBAR-XXX (3 digits for numbers > 99)
  IF next_num > 99 THEN
    result := 'MBAR-' || next_num::text;
  ELSE
    result := 'MBAR-' || LPAD(next_num::text, 2, '0');
  END IF;
  
  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_next_artist_number() TO authenticated;

-- ============================================
-- 5. TEST THE FIX
-- ============================================

-- Test inserting with 3-digit number
SELECT 'Testing 3-digit artist number insertion:' as info;
INSERT INTO artist_invitations (
    email,
    first_name,
    last_name,
    artist_number,
    invitation_code,
    created_by
) VALUES (
    'working-test@example.com',
    'Working',
    'Test',
    'MBAR-100',
    'WORKING_TEST_100',
    (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT (invitation_code) DO NOTHING;

-- Test the get_next_artist_number function
SELECT 'Testing get_next_artist_number function:' as info;
SELECT get_next_artist_number() as next_artist_number;

-- ============================================
-- 6. VERIFICATION
-- ============================================

-- Show updated constraint
SELECT 'Updated artist number constraint:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'artist_invitations'::regclass 
AND conname = 'artist_invitations_artist_number_check';

-- Show all artist invitations
SELECT 'All artist invitations:' as info;
SELECT 
    invitation_code,
    email,
    artist_number,
    used,
    created_at
FROM artist_invitations 
ORDER BY created_at DESC;

-- ============================================
-- 7. FINAL STATUS
-- ============================================

SELECT 'Artist number constraint fix complete!' as final_status;
SELECT 'You can now use artist numbers like MBAR-100, MBAR-101, etc.' as next_steps;
