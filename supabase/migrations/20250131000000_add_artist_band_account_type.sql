-- Add Artist/Band Account Type and Applications
-- This migration adds support for artist/band accounts that use the producer system

-- ============================================
-- 1. UPDATE PROFILES TABLE ACCOUNT TYPE CONSTRAINT
-- ============================================

-- Drop the existing check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;

-- Add the new check constraint that includes 'artist_band' and 'rights_holder'
ALTER TABLE profiles ADD CONSTRAINT profiles_account_type_check 
CHECK (account_type IN ('client', 'producer', 'admin', 'white_label', 'admin,producer', 'rights_holder', 'artist_band'));

-- Add comment to document the new account type
COMMENT ON COLUMN profiles.account_type IS 'Type of account: client, producer, admin, white_label, admin,producer, rights_holder, or artist_band';

-- ============================================
-- 2. CREATE ARTIST APPLICATIONS TABLE
-- ============================================

-- Create artist_applications table (similar to producer_applications but with artist-specific fields)
CREATE TABLE IF NOT EXISTS artist_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at timestamp with time zone DEFAULT timezone('utc', now()),

  -- Basic information
  name text NOT NULL,
  email text NOT NULL,
  
  -- Artist/Band specific information
  artist_type text NOT NULL CHECK (artist_type IN ('solo', 'duo', 'band')),
  primary_genre text NOT NULL,
  stage_name text,
  
  -- Production information
  music_producer text NOT NULL,
  production_method text NOT NULL,
  uses_premade_tracks text CHECK (uses_premade_tracks IN ('Yes', 'No')),
  
  -- Rights and ownership
  master_rights_owner text NOT NULL,
  publishing_rights_owner text NOT NULL,
  shares_ownership text CHECK (shares_ownership IN ('Yes', 'No')),
  ownership_explanation text,
  is_one_stop text CHECK (is_one_stop IN ('Yes', 'No')),
  
  -- Catalog information
  has_streaming_releases text CHECK (has_streaming_releases IN ('Yes', 'No')),
  streaming_links text,
  catalog_track_count text,
  has_instrumentals text CHECK (has_instrumentals IN ('Yes', 'No')),
  has_stems text CHECK (has_stems IN ('Yes', 'No')),
  
  -- Sync experience
  has_sync_licenses text CHECK (has_sync_licenses IN ('Yes', 'No')),
  understands_rights_requirement text CHECK (understands_rights_requirement IN ('Yes', 'No')),
  
  -- Account management
  account_manager_name text NOT NULL,
  account_manager_email text NOT NULL,
  account_manager_phone text NOT NULL,
  account_manager_authority text CHECK (account_manager_authority IN ('Yes', 'No')),
  
  -- Sync licensing and quiz fields
  sync_licensing_course text,
  quiz_question_1 text,
  quiz_question_2 text,
  quiz_question_3 text,
  quiz_question_4 text,
  quiz_question_5 text,
  quiz_score integer DEFAULT 0,
  quiz_total_questions integer DEFAULT 5,
  quiz_completed boolean DEFAULT false,
  
  -- Application status and review
  status text DEFAULT 'new',
  review_tier text,
  auto_disqualified boolean DEFAULT false,
  
  -- Scoring system (1-100)
  application_score integer DEFAULT 0,
  score_breakdown jsonb,
  
  -- Additional fields for consistency with producer applications
  additional_info text,
  rejection_reason text,
  manual_review boolean DEFAULT false,
  manual_review_approved boolean DEFAULT false
);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE artist_applications ENABLE ROW LEVEL SECURITY;

-- Public insert policy (anyone can submit an application)
CREATE POLICY "Allow inserts for anonymous users" ON artist_applications
  FOR INSERT WITH CHECK (true);

-- Admin read policy
CREATE POLICY "Admins can read all applications" ON artist_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type IN ('admin', 'admin,producer')
    )
  );

-- Admin update policy
CREATE POLICY "Admins can update applications" ON artist_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type IN ('admin', 'admin,producer')
    )
  );

-- ============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_artist_applications_status ON artist_applications(status);
CREATE INDEX IF NOT EXISTS idx_artist_applications_created_at ON artist_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artist_applications_email ON artist_applications(email);
CREATE INDEX IF NOT EXISTS idx_artist_applications_score ON artist_applications(application_score DESC);

-- ============================================
-- 5. VERIFY THE CHANGES
-- ============================================

-- Check the updated constraint
SELECT 'Updated account_type constraint:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND conname = 'profiles_account_type_check';

-- Check the new table structure
SELECT 'Artist applications table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'artist_applications'
ORDER BY ordinal_position;
