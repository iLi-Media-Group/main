-- Fix active_pitch_opportunities view and ensure all tables exist
-- This migration ensures the pitch service tables and views are properly created

-- First, ensure the pitch_opportunities table exists with all required columns
CREATE TABLE IF NOT EXISTS pitch_opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_company TEXT,
    brief_type TEXT NOT NULL CHECK (brief_type IN ('sync', 'licensing', 'custom')),
    genre_requirements TEXT[],
    mood_requirements TEXT[],
    instrument_requirements TEXT[],
    media_usage_requirements TEXT[],
    bpm_range_min INTEGER,
    bpm_range_max INTEGER,
    key_requirements TEXT[],
    duration_requirements TEXT,
    vocals_required BOOLEAN DEFAULT false,
    vocals_type TEXT CHECK (vocals_type IN ('lead_vocals', 'background_vocals', 'no_vocals', 'either')),
    budget_range TEXT,
    deadline TIMESTAMPTZ,
    submission_email TEXT NOT NULL,
    submission_instructions TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'completed', 'cancelled')),
    is_priority BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add assigned_agent column if it doesn't exist
ALTER TABLE pitch_opportunities 
ADD COLUMN IF NOT EXISTS assigned_agent UUID REFERENCES auth.users(id);

-- Ensure pitch_submissions table exists
CREATE TABLE IF NOT EXISTS pitch_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    opportunity_id UUID NOT NULL REFERENCES pitch_opportunities(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES auth.users(id),
    submission_notes TEXT,
    submission_status TEXT DEFAULT 'submitted' CHECK (submission_status IN ('submitted', 'selected', 'rejected', 'placed')),
    selection_notes TEXT,
    placement_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(opportunity_id, track_id)
);

-- Drop and recreate the view with the assigned_agent column
DROP VIEW IF EXISTS active_pitch_opportunities;

CREATE OR REPLACE VIEW active_pitch_opportunities AS
SELECT 
    po.*,
    COUNT(ps.id) as total_submissions,
    COUNT(CASE WHEN ps.submission_status = 'selected' THEN 1 END) as selected_submissions,
    COUNT(CASE WHEN ps.submission_status = 'placed' THEN 1 END) as placed_submissions
FROM pitch_opportunities po
LEFT JOIN pitch_submissions ps ON po.id = ps.opportunity_id
WHERE po.status = 'active'
GROUP BY po.id;

-- Add comment for documentation
COMMENT ON VIEW active_pitch_opportunities IS 'View for active pitch opportunities with submission counts and assigned agent information';
