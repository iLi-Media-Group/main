-- Comprehensive Fix for Producer Invitation System Issues
-- Run this in Supabase SQL Editor to fix all the errors

-- ============================================
-- 1. FIX PRODUCER_INVITATIONS RLS POLICIES (403 errors)
-- ============================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow admins to read producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Allow admins to insert producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Allow admins to update producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Admins can manage producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Enable read access for admins" ON producer_invitations;
DROP POLICY IF EXISTS "Enable insert access for admins" ON producer_invitations;
DROP POLICY IF EXISTS "Enable update access for admins" ON producer_invitations;
DROP POLICY IF EXISTS "Enable service role access" ON producer_invitations;
DROP POLICY IF EXISTS "Admin access to producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Service role access to producer invitations" ON producer_invitations;
DROP POLICY IF EXISTS "Allow public read for validation" ON producer_invitations;

-- Create new, more permissive policies for admin access
CREATE POLICY "Enable read access for admins" ON producer_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );

CREATE POLICY "Enable insert access for admins" ON producer_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );

CREATE POLICY "Enable update access for admins" ON producer_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.account_type LIKE '%admin%' OR profiles.account_type = 'admin,producer')
    )
  );

-- Also create a policy for service role access (for edge functions)
CREATE POLICY "Enable service role access" ON producer_invitations
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 2. FIX PRODUCER_APPLICATIONS DATA TYPES (400 errors)
-- ============================================

-- Add missing columns with correct data types
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS review_tier TEXT,
ADD COLUMN IF NOT EXISTS is_auto_rejected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'professional')),
ADD COLUMN IF NOT EXISTS genres TEXT[],
ADD COLUMN IF NOT EXISTS instruments TEXT[],
ADD COLUMN IF NOT EXISTS equipment TEXT,
ADD COLUMN IF NOT EXISTS social_media_links JSONB,
ADD COLUMN IF NOT EXISTS portfolio_links TEXT[],
ADD COLUMN IF NOT EXISTS why_join TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add new instrument fields with correct data types
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS instrument_one TEXT,
ADD COLUMN IF NOT EXISTS instrument_one_proficiency TEXT CHECK (instrument_one_proficiency IN ('beginner', 'intermediate', 'pro')),
ADD COLUMN IF NOT EXISTS instrument_two TEXT,
ADD COLUMN IF NOT EXISTS instrument_two_proficiency TEXT CHECK (instrument_two_proficiency IN ('beginner', 'intermediate', 'pro')),
ADD COLUMN IF NOT EXISTS instrument_three TEXT,
ADD COLUMN IF NOT EXISTS instrument_three_proficiency TEXT CHECK (instrument_three_proficiency IN ('beginner', 'intermediate', 'pro')),
ADD COLUMN IF NOT EXISTS instrument_four TEXT,
ADD COLUMN IF NOT EXISTS instrument_four_proficiency TEXT CHECK (instrument_four_proficiency IN ('beginner', 'intermediate', 'pro'));

-- Add recording artists fields
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS records_artists TEXT CHECK (records_artists IN ('Yes', 'No')),
ADD COLUMN IF NOT EXISTS artist_example_link TEXT;

-- Add quiz fields
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS quiz_question_1 TEXT,
ADD COLUMN IF NOT EXISTS quiz_question_2 TEXT,
ADD COLUMN IF NOT EXISTS quiz_question_3 TEXT,
ADD COLUMN IF NOT EXISTS quiz_question_4 TEXT,
ADD COLUMN IF NOT EXISTS quiz_question_5 TEXT,
ADD COLUMN IF NOT EXISTS quiz_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quiz_total_questions INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS quiz_completed BOOLEAN DEFAULT FALSE;

-- Add sync licensing field
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS sync_licensing_course TEXT;

-- Add AI generated music field
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS ai_generated_music TEXT;

-- Add ranking fields
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS ranking_score INTEGER,
ADD COLUMN IF NOT EXISTS ranking_breakdown JSONB,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ============================================
-- 3. FIX BACKGROUND_ASSETS RLS POLICIES (406 errors)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON background_assets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON background_assets;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON background_assets;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON background_assets;
DROP POLICY IF EXISTS "Public read access for background assets" ON background_assets;
DROP POLICY IF EXISTS "Admin full access for background assets" ON background_assets;

-- Create proper RLS policies for background_assets
CREATE POLICY "Enable read access for all users" ON background_assets
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON background_assets
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users only" ON background_assets
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users only" ON background_assets
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- 4. FIX VALIDATE_PRODUCER_INVITATION FUNCTION
-- ============================================

-- Drop and recreate the function with proper logic
DROP FUNCTION IF EXISTS validate_producer_invitation(text, text);
CREATE OR REPLACE FUNCTION validate_producer_invitation(code text, email_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_exists boolean;
BEGIN
  -- Check if invitation exists and is valid
  SELECT EXISTS (
    SELECT 1 FROM producer_invitations
    WHERE invitation_code = code
    AND (email IS NULL OR email = validate_producer_invitation.email_address)
    AND (used IS NULL OR used = FALSE)
  ) INTO invitation_exists;
  
  RETURN invitation_exists;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_producer_invitation(text, text) TO anon;
GRANT EXECUTE ON FUNCTION validate_producer_invitation(text, text) TO authenticated;

-- ============================================
-- 5. VERIFY FIXES
-- ============================================

-- Check producer_invitations policies
SELECT 'Producer invitations policies:' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'producer_invitations';

-- Check background_assets policies
SELECT 'Background assets policies:' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'background_assets';

-- Test if we can query the tables
SELECT 'Testing table access:' as info;
SELECT COUNT(*) as invitation_count FROM producer_invitations;
SELECT COUNT(*) as background_assets_count FROM background_assets;

-- Check producer_applications structure
SELECT 'Producer applications columns:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
ORDER BY ordinal_position;

-- Test the validate function
SELECT 'Testing validate_producer_invitation function:' as info;
SELECT validate_producer_invitation('test-code', 'test@example.com') as function_works;

SELECT 'All fixes applied successfully!' as status;
