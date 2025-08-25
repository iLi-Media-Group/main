-- Add Ranking Fields to producer_applications
-- This adds fields to store calculated ranking scores and breakdowns

-- Add ranking score field
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS ranking_score integer;

-- Add ranking breakdown JSON field
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS ranking_breakdown jsonb;

-- Add auto-rejection fields
ALTER TABLE producer_applications 
ADD COLUMN IF NOT EXISTS is_auto_rejected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Verify the new columns
SELECT 'New ranking columns added:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
AND column_name IN (
    'ranking_score',
    'ranking_breakdown',
    'is_auto_rejected',
    'rejection_reason'
)
ORDER BY column_name;

-- Show the complete table structure
SELECT 'Complete table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
ORDER BY ordinal_position; 