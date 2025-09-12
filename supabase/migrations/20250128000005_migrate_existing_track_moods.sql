-- Migrate existing track moods to new table structure
-- This migration moves existing moods from tracks.moods TEXT[] to track_moods junction table

-- 1. First, let's create a function to safely migrate moods
CREATE OR REPLACE FUNCTION migrate_track_moods()
RETURNS void AS $$
DECLARE
    track_record RECORD;
    mood_name TEXT;
    sub_mood_record RECORD;
BEGIN
    -- Loop through all tracks that have moods
    FOR track_record IN 
        SELECT id, moods 
        FROM tracks 
        WHERE moods IS NOT NULL AND array_length(moods, 1) > 0
    LOOP
        -- Loop through each mood in the track's moods array
        FOREACH mood_name IN ARRAY track_record.moods
        LOOP
            -- Find the corresponding sub_mood record
            SELECT sm.id INTO sub_mood_record
            FROM sub_moods sm
            WHERE sm.name = mood_name
            LIMIT 1;
            
            -- If we found a matching sub_mood, create the track_moods relationship
            IF sub_mood_record.id IS NOT NULL THEN
                INSERT INTO track_moods (track_id, sub_mood_id)
                VALUES (track_record.id, sub_mood_record.id)
                ON CONFLICT (track_id, sub_mood_id) DO NOTHING;
            ELSE
                -- Log unmapped moods for manual review
                RAISE NOTICE 'Unmapped mood found: % for track %', mood_name, track_record.id;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. Execute the migration
SELECT migrate_track_moods();

-- 3. Clean up the function
DROP FUNCTION migrate_track_moods();

-- 4. Add a comment to the tracks table about the migration
COMMENT ON COLUMN tracks.moods IS 'DEPRECATED: This column contains legacy mood data. New tracks should use the track_moods junction table. This column will be removed in a future migration.';

-- 5. Create a view to help with the transition (shows both old and new mood data)
CREATE OR REPLACE VIEW track_moods_comparison AS
SELECT 
    t.id as track_id,
    t.title as track_title,
    t.moods as legacy_moods,
    array_agg(sm.name ORDER BY sm.name) as new_moods,
    array_agg(sm.display_name ORDER BY sm.display_name) as new_mood_display_names
FROM tracks t
LEFT JOIN track_moods tm ON t.id = tm.track_id
LEFT JOIN sub_moods sm ON tm.sub_mood_id = sm.id
WHERE t.moods IS NOT NULL AND array_length(t.moods, 1) > 0
GROUP BY t.id, t.title, t.moods
ORDER BY t.title;

-- 6. Create a function to get track moods in the new format
CREATE OR REPLACE FUNCTION get_track_moods(track_uuid UUID)
RETURNS TABLE(
    mood_id UUID,
    mood_name TEXT,
    mood_display_name TEXT,
    sub_mood_id UUID,
    sub_mood_name TEXT,
    sub_mood_display_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as mood_id,
        m.name as mood_name,
        m.display_name as mood_display_name,
        sm.id as sub_mood_id,
        sm.name as sub_mood_name,
        sm.display_name as sub_mood_display_name
    FROM track_moods tm
    JOIN sub_moods sm ON tm.sub_mood_id = sm.id
    JOIN moods m ON sm.mood_id = m.id
    WHERE tm.track_id = track_uuid
    ORDER BY m.display_order, sm.display_order;
END;
$$ LANGUAGE plpgsql;
