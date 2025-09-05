-- Create moods and sub_moods tables with proper structure
-- This migration creates the new table structure while preserving existing data

-- 1. Create moods table (main mood categories)
CREATE TABLE IF NOT EXISTS moods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create sub_moods table (individual mood descriptors)
CREATE TABLE IF NOT EXISTS sub_moods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mood_id UUID NOT NULL REFERENCES moods(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mood_id, name)
);

-- 3. Create track_moods junction table to link tracks to their selected sub-moods
CREATE TABLE IF NOT EXISTS track_moods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    sub_mood_id UUID NOT NULL REFERENCES sub_moods(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(track_id, sub_mood_id)
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sub_moods_mood_id ON sub_moods(mood_id);
CREATE INDEX IF NOT EXISTS idx_track_moods_track_id ON track_moods(track_id);
CREATE INDEX IF NOT EXISTS idx_track_moods_sub_mood_id ON track_moods(sub_mood_id);

-- 5. Enable RLS on new tables
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_moods ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for moods table
CREATE POLICY "moods_select_policy" ON moods
    FOR SELECT USING (true);

CREATE POLICY "moods_insert_policy" ON moods
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "moods_update_policy" ON moods
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "moods_delete_policy" ON moods
    FOR DELETE USING (auth.role() = 'authenticated');

-- 7. Create RLS policies for sub_moods table
CREATE POLICY "sub_moods_select_policy" ON sub_moods
    FOR SELECT USING (true);

CREATE POLICY "sub_moods_insert_policy" ON sub_moods
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "sub_moods_update_policy" ON sub_moods
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "sub_moods_delete_policy" ON sub_moods
    FOR DELETE USING (auth.role() = 'authenticated');

-- 8. Create RLS policies for track_moods table
CREATE POLICY "track_moods_select_policy" ON track_moods
    FOR SELECT USING (true);

CREATE POLICY "track_moods_insert_policy" ON track_moods
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "track_moods_update_policy" ON track_moods
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "track_moods_delete_policy" ON track_moods
    FOR DELETE USING (auth.role() = 'authenticated');
