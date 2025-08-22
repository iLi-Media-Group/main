-- Migrate existing track instruments and media usage data to junction tables

-- First, create track_instruments junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS track_instruments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(track_id, instrument_id)
);

-- Add RLS policies for track_instruments
ALTER TABLE track_instruments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view track instruments" ON track_instruments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert track instruments" ON track_instruments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update track instruments" ON track_instruments
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete track instruments" ON track_instruments
    FOR DELETE USING (true);

-- Migrate existing track instruments data
INSERT INTO track_instruments (track_id, instrument_id)
SELECT DISTINCT
    t.id as track_id,
    i.id as instrument_id
FROM tracks t
CROSS JOIN LATERAL unnest(t.instruments) AS instrument_name
JOIN instruments i ON i.name = instrument_name
WHERE t.instruments IS NOT NULL 
AND t.instruments != '{}' 
AND array_length(t.instruments, 1) > 0
ON CONFLICT (track_id, instrument_id) DO NOTHING;

-- Migrate existing track media usage data
-- First, we need to parse the hierarchical media usage strings and match them to media_types
INSERT INTO track_media_types (track_id, media_type_id)
SELECT DISTINCT
    t.id as track_id,
    mt.id as media_type_id
FROM tracks t
CROSS JOIN LATERAL unnest(t.media_usage) AS media_usage_string
JOIN media_types mt ON mt.name = media_usage_string
WHERE t.media_usage IS NOT NULL 
AND t.media_usage != '{}' 
AND array_length(t.media_usage, 1) > 0
ON CONFLICT (track_id, media_type_id) DO NOTHING;

-- Show migration results
SELECT 
    'Migration Summary' as info,
    'Track instruments migrated' as type,
    COUNT(*) as count
FROM track_instruments
UNION ALL
SELECT 
    'Migration Summary' as info,
    'Track media types migrated' as type,
    COUNT(*) as count
FROM track_media_types;

-- Show sample migrated data
SELECT 
    'Sample migrated instruments' as info,
    t.title,
    array_agg(i.name) as instruments
FROM tracks t
JOIN track_instruments ti ON t.id = ti.track_id
JOIN instruments i ON ti.instrument_id = i.id
GROUP BY t.id, t.title
LIMIT 5;

SELECT 
    'Sample migrated media types' as info,
    t.title,
    array_agg(mt.name) as media_types
FROM tracks t
JOIN track_media_types tmt ON t.id = tmt.track_id
JOIN media_types mt ON tmt.media_type_id = mt.id
GROUP BY t.id, t.title
LIMIT 5;
