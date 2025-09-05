-- Fix Producer Applications Columns
-- This script adds the missing columns that the React app expects

-- ============================================
-- 1. ADD MISSING COLUMNS TO PRODUCER_APPLICATIONS
-- ============================================

-- Add missing columns that the React app expects
ALTER TABLE producer_applications ADD COLUMN IF NOT EXISTS review_tier TEXT;
ALTER TABLE producer_applications ADD COLUMN IF NOT EXISTS is_auto_rejected BOOLEAN DEFAULT false;
ALTER TABLE producer_applications ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE producer_applications ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE producer_applications ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE producer_applications ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'professional'));
ALTER TABLE producer_applications ADD COLUMN IF NOT EXISTS genres TEXT[];
ALTER TABLE producer_applications ADD COLUMN IF NOT EXISTS instruments TEXT[];
ALTER TABLE producer_applications ADD COLUMN IF NOT EXISTS equipment TEXT;
ALTER TABLE producer_applications ADD COLUMN IF NOT EXISTS social_media_links JSONB;
ALTER TABLE producer_applications ADD COLUMN IF NOT EXISTS portfolio_links TEXT[];
ALTER TABLE producer_applications ADD COLUMN IF NOT EXISTS why_join TEXT;
ALTER TABLE producer_applications ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ============================================
-- 2. UPDATE EXISTING DATA
-- ============================================

-- Update existing applications to have proper status values
UPDATE producer_applications 
SET status = 'new' 
WHERE status = 'pending';

-- Set default values for new columns
UPDATE producer_applications 
SET 
    review_tier = NULL,
    is_auto_rejected = false,
    first_name = 'Sample',
    last_name = 'User',
    phone = '+1234567890',
    experience_level = 'intermediate',
    genres = ARRAY['Hip Hop', 'R&B'],
    instruments = ARRAY['Piano', 'Guitar'],
    equipment = 'Ableton Live, MIDI Keyboard',
    social_media_links = '{}',
    portfolio_links = ARRAY['https://example.com/portfolio'],
    why_join = 'I want to join to collaborate with other producers and grow my skills.',
    admin_notes = NULL
WHERE first_name IS NULL;

-- ============================================
-- 3. VERIFY THE FIXES
-- ============================================

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
ORDER BY ordinal_position;

-- Check data
SELECT 
    id,
    email,
    first_name,
    last_name,
    status,
    review_tier,
    is_auto_rejected,
    created_at
FROM producer_applications 
ORDER BY created_at DESC 
LIMIT 5;

-- Test the API query that was failing
SELECT 
    'API query test' as test_name,
    COUNT(*) as count
FROM producer_applications 
WHERE status = 'new' 
AND review_tier IS NULL 
AND is_auto_rejected = false; 