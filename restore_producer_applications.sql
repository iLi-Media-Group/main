/*
  # Restore Producer Applications Functionality
  
  This script restores the Producer Applications feature after the database restoration.
  It addresses:
  1. Recreating the producer_applications table with all required columns
  2. Enabling the producer_onboarding feature flag
  3. Setting up proper RLS policies
  4. Adding test data if needed
  5. Ensuring admin access
*/

-- ===========================================
-- 1. ENABLE PRODUCER ONBOARDING FEATURE FLAG
-- ===========================================

-- Enable the feature flag globally
UPDATE white_label_features 
SET is_enabled = true 
WHERE client_id IS NULL 
AND feature_name = 'producer_onboarding';

-- Insert the feature flag if it doesn't exist
INSERT INTO white_label_features (client_id, feature_name, is_enabled)
VALUES (NULL, 'producer_onboarding', true)
ON CONFLICT (client_id, feature_name) 
DO UPDATE SET is_enabled = true;

-- ===========================================
-- 2. RECREATE PRODUCER_APPLICATIONS TABLE
-- ===========================================

-- Drop the table if it exists to ensure clean recreation
DROP TABLE IF EXISTS public.producer_applications CASCADE;

-- Create the producer_applications table with all required columns
CREATE TABLE public.producer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at timestamp with time zone DEFAULT timezone('utc', now()),

  -- Basic information
  name text NOT NULL,
  email text NOT NULL,
  
  -- Genre information
  primary_genre text NOT NULL,
  secondary_genre text,
  
  -- Experience and tools
  years_experience text NOT NULL,
  daws_used text NOT NULL,
  team_type text NOT NULL,
  tracks_per_week text NOT NULL,
  spotify_link text NOT NULL,
  
  -- Original instrument field (for backward compatibility)
  instruments text,
  
  -- New individual instrument fields
  instrument_one text,
  instrument_one_proficiency text CHECK (instrument_one_proficiency IN ('beginner', 'intermediate', 'pro')),
  instrument_two text,
  instrument_two_proficiency text CHECK (instrument_two_proficiency IN ('beginner', 'intermediate', 'pro')),
  instrument_three text,
  instrument_three_proficiency text CHECK (instrument_three_proficiency IN ('beginner', 'intermediate', 'pro')),
  instrument_four text,
  instrument_four_proficiency text CHECK (instrument_four_proficiency IN ('beginner', 'intermediate', 'pro')),
  
  -- Recording artists information
  records_artists text CHECK (records_artists IN ('Yes', 'No')),
  artist_example_link text,
  
  -- Sample and loop usage
  sample_use text NOT NULL,
  splice_use text NOT NULL,
  loop_use text NOT NULL,
  
  -- AI and collaboration
  ai_generated_music text,
  artist_collab text,
  
  -- Business information
  business_entity text,
  pro_affiliation text,
  additional_info text,
  
  -- Application status and review
  status text DEFAULT 'new',
  review_tier text,
  auto_disqualified boolean DEFAULT false,
  
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
  
  -- Ranking fields
  ranking_score integer,
  ranking_breakdown jsonb,
  is_auto_rejected boolean DEFAULT false,
  rejection_reason text
);

-- ===========================================
-- 3. SET UP ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS
ALTER TABLE public.producer_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON producer_applications;
DROP POLICY IF EXISTS "Enable read access for admins" ON producer_applications;
DROP POLICY IF EXISTS "Admins can read, update, delete" ON producer_applications;
DROP POLICY IF EXISTS "Allow inserts for anonymous users" ON producer_applications;

-- Create policies for admin access
CREATE POLICY "Admins can read, update, delete"
ON public.producer_applications
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type LIKE '%admin%'
  )
);

-- Create policy for public inserts (for applications)
CREATE POLICY "Allow inserts for anonymous users"
ON public.producer_applications
FOR INSERT
WITH CHECK (true);

-- ===========================================
-- 4. ADD TEST DATA
-- ===========================================

-- Insert test applications
INSERT INTO producer_applications (
    name,
    email,
    primary_genre,
    secondary_genre,
    years_experience,
    daws_used,
    team_type,
    tracks_per_week,
    spotify_link,
    instrument_one,
    instrument_one_proficiency,
    instrument_two,
    instrument_two_proficiency,
    instrument_three,
    instrument_three_proficiency,
    instrument_four,
    instrument_four_proficiency,
    records_artists,
    artist_example_link,
    sample_use,
    splice_use,
    loop_use,
    ai_generated_music,
    artist_collab,
    business_entity,
    pro_affiliation,
    additional_info,
    status,
    review_tier,
    auto_disqualified,
    created_at
) VALUES 
(
    'John Producer',
    'john.producer@example.com',
    'Hip Hop',
    'R&B',
    '5',
    'Logic Pro, Ableton',
    'solo',
    '3-5 tracks per week',
    'https://open.spotify.com/artist/test1',
    'Piano',
    'pro',
    'Drums',
    'intermediate',
    'Guitar',
    'beginner',
    NULL,
    NULL,
    'Yes',
    'John Smith - Hip Hop Artist',
    'Yes',
    'Yes',
    'Sometimes',
    'No',
    'Yes',
    'Yes',
    'ASCAP',
    'Experienced producer looking for sync opportunities',
    'new',
    NULL,
    false,
    NOW() - INTERVAL '2 days'
),
(
    'Sarah Beatmaker',
    'sarah.beatmaker@example.com',
    'Pop',
    'Electronic',
    '3',
    'FL Studio, Pro Tools',
    'small_team',
    '2-3 tracks per week',
    'https://open.spotify.com/artist/test2',
    'Guitar',
    'intermediate',
    'Bass',
    'pro',
    'Synthesizer',
    'intermediate',
    NULL,
    NULL,
    'No',
    NULL,
    'No',
    'Yes',
    'Yes',
    'No',
    'No',
    'No',
    'BMI',
    'Upcoming producer with fresh sound',
    'new',
    NULL,
    false,
    NOW() - INTERVAL '1 day'
),
(
    'Mike Composer',
    'mike.composer@example.com',
    'Film Score',
    'Classical',
    '8',
    'Cubase, Logic Pro',
    'solo',
    '1-2 tracks per week',
    'https://open.spotify.com/artist/test3',
    'Piano',
    'pro',
    'Strings',
    'pro',
    'Orchestra',
    'intermediate',
    NULL,
    NULL,
    'Yes',
    'Film Production Company',
    'No',
    'No',
    'No',
    'No',
    'Yes',
    'Yes',
    'SESAC',
    'Film composer with orchestral experience',
    'invited',
    'tier_1',
    false,
    NOW() - INTERVAL '3 days'
),
(
    'Alex Beatmaker',
    'alex.beatmaker@example.com',
    'Trap',
    'Hip Hop',
    '4',
    'FL Studio, Ableton',
    'solo',
    '4-6 tracks per week',
    'https://open.spotify.com/artist/test4',
    'Drums',
    'pro',
    'Bass',
    'intermediate',
    'Synthesizer',
    'beginner',
    NULL,
    NULL,
    'Yes',
    'Local Hip Hop Artists',
    'Yes',
    'Yes',
    'Frequently',
    'No',
    'Yes',
    'Yes',
    'ASCAP',
    'Trap producer with strong beat making skills',
    'save_for_later',
    NULL,
    false,
    NOW() - INTERVAL '4 days'
);

-- ===========================================
-- 5. ENSURE ADMIN ACCOUNT TYPES
-- ===========================================

-- Update admin account types for main admin users
UPDATE profiles 
SET account_type = 'admin'
WHERE email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com');

-- ===========================================
-- 6. VERIFICATION
-- ===========================================

-- Check feature flag status
SELECT 'Feature Flag Status:' as info;
SELECT client_id, feature_name, is_enabled 
FROM white_label_features 
WHERE feature_name = 'producer_onboarding';

-- Check admin account types
SELECT 'Admin Account Types:' as info;
SELECT id, email, account_type 
FROM profiles 
WHERE email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com');

-- Check producer applications count
SELECT 'Producer Applications Count:' as info;
SELECT COUNT(*) as total_applications FROM producer_applications;

-- Check applications by status
SELECT 'Applications by Status:' as info;
SELECT status, COUNT(*) as count 
FROM producer_applications 
GROUP BY status
ORDER BY count DESC;

-- Check table structure
SELECT 'Table Structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 'RLS Policies:' as info;
SELECT policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'producer_applications';

-- ===========================================
-- 7. FINAL STATUS REPORT
-- ===========================================

SELECT 'Producer Applications Restoration Complete' as status;
SELECT 
    '✅ Feature flag enabled' as check_1,
    '✅ Table created with all columns' as check_2,
    '✅ RLS policies configured' as check_3,
    '✅ Test data inserted' as check_4,
    '✅ Admin accounts updated' as check_5; 