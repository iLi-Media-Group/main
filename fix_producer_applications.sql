-- Fix Producer Applications Feature
-- This script ensures producer applications work properly on the admin dashboard

-- ============================================
-- 1. CREATE PRODUCER_APPLICATIONS TABLE
-- ============================================

-- Create producer_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS producer_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'professional')),
    genres TEXT[],
    instruments TEXT[],
    equipment TEXT,
    social_media_links JSONB,
    portfolio_links TEXT[],
    why_join TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'interview')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_producer_applications_status ON producer_applications(status);
CREATE INDEX IF NOT EXISTS idx_producer_applications_created_at ON producer_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_producer_applications_user_id ON producer_applications(user_id);

-- Enable RLS
ALTER TABLE producer_applications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. FIX RLS POLICIES FOR PRODUCER_APPLICATIONS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own applications" ON producer_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON producer_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON producer_applications;
DROP POLICY IF EXISTS "Users can insert applications" ON producer_applications;

-- Create policies
-- Users can view their own applications
CREATE POLICY "Users can view their own applications" ON producer_applications
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications" ON producer_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.account_type = 'admin' OR profiles.account_type = 'admin,producer')
        )
    );

-- Admins can update applications
CREATE POLICY "Admins can update applications" ON producer_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.account_type = 'admin' OR profiles.account_type = 'admin,producer')
        )
    );

-- Users can insert applications
CREATE POLICY "Users can insert applications" ON producer_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. ENABLE PRODUCER ONBOARDING FEATURE
-- ============================================

-- Ensure white_label_features table exists
CREATE TABLE IF NOT EXISTS white_label_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES white_label_clients(id),
    feature_name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, feature_name)
);

-- Enable producer_onboarding feature flag globally
UPDATE white_label_features 
SET is_enabled = true 
WHERE client_id IS NULL 
AND feature_name = 'producer_onboarding';

-- If the record doesn't exist, insert it
INSERT INTO white_label_features (client_id, feature_name, is_enabled)
VALUES (NULL, 'producer_onboarding', true)
ON CONFLICT (client_id, feature_name) 
DO UPDATE SET is_enabled = true;

-- ============================================
-- 4. FIX WHITE_LABEL_CLIENTS TABLE
-- ============================================

-- Add producer_onboarding_enabled column if it doesn't exist
ALTER TABLE white_label_clients ADD COLUMN IF NOT EXISTS producer_onboarding_enabled BOOLEAN DEFAULT false;
ALTER TABLE white_label_clients ADD COLUMN IF NOT EXISTS producer_onboarding_paid BOOLEAN DEFAULT false;

-- Enable producer_onboarding for all existing clients (or just the main one)
UPDATE white_label_clients 
SET producer_onboarding_enabled = true, producer_onboarding_paid = true
WHERE id IS NOT NULL;

-- ============================================
-- 5. ADD SAMPLE APPLICATIONS FOR TESTING
-- ============================================

-- Insert sample applications if table is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM producer_applications LIMIT 1) THEN
        INSERT INTO producer_applications (
            email, first_name, last_name, phone, experience_level, 
            genres, instruments, equipment, why_join, status
        ) VALUES 
        (
            'sample@example.com', 'John', 'Doe', '+1234567890', 'intermediate',
            ARRAY['Hip Hop', 'R&B'], ARRAY['Piano', 'Guitar'], 'Ableton Live, MIDI Keyboard',
            'I want to join to collaborate with other producers and grow my skills.',
            'pending'
        ),
        (
            'producer@example.com', 'Jane', 'Smith', '+1987654321', 'advanced',
            ARRAY['Pop', 'Electronic'], ARRAY['Drums', 'Bass'], 'Logic Pro, Studio Monitors',
            'Looking to expand my network and find new opportunities.',
            'pending'
        );
    END IF;
END $$;

-- ============================================
-- 6. VERIFY FIXES
-- ============================================

-- Check if table exists
SELECT 
    'producer_applications table exists' as check_item,
    COUNT(*) as result
FROM information_schema.tables 
WHERE table_name = 'producer_applications';

-- Check feature flag in white_label_features
SELECT 
    'producer_onboarding feature enabled' as check_item,
    COUNT(*) as result
FROM white_label_features 
WHERE feature_name = 'producer_onboarding' AND is_enabled = true;

-- Check feature flag in white_label_clients
SELECT 
    'producer_onboarding_enabled in clients' as check_item,
    COUNT(*) as result
FROM white_label_clients 
WHERE producer_onboarding_enabled = true;

-- Check applications count
SELECT 
    'producer_applications count' as description,
    COUNT(*) as count
FROM producer_applications;

-- Check RLS policies
SELECT 
    'producer_applications policies' as description,
    COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'producer_applications'; 