-- Safe SQL script to create instruments and media types tables without affecting existing data
-- Run this directly in your Supabase SQL editor

-- 1. Create instrument_categories table (main instrument categories)
CREATE TABLE IF NOT EXISTS instrument_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create instruments table (individual instruments)
CREATE TABLE IF NOT EXISTS instruments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES instrument_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, name)
);

-- 3. Create track_instruments junction table
CREATE TABLE IF NOT EXISTS track_instruments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(track_id, instrument_id)
);

-- 4. Create media_categories table (main media usage categories)
CREATE TABLE IF NOT EXISTS media_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create media_types table (individual media types)
CREATE TABLE IF NOT EXISTS media_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES media_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, name)
);

-- 6. Create track_media_types junction table
CREATE TABLE IF NOT EXISTS track_media_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    media_type_id UUID NOT NULL REFERENCES media_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(track_id, media_type_id)
);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_instruments_category_id ON instruments(category_id);
CREATE INDEX IF NOT EXISTS idx_track_instruments_track_id ON track_instruments(track_id);
CREATE INDEX IF NOT EXISTS idx_track_instruments_instrument_id ON track_instruments(instrument_id);
CREATE INDEX IF NOT EXISTS idx_media_types_category_id ON media_types(category_id);
CREATE INDEX IF NOT EXISTS idx_track_media_types_track_id ON track_media_types(track_id);
CREATE INDEX IF NOT EXISTS idx_track_media_types_media_type_id ON track_media_types(media_type_id);

-- 8. Enable RLS on new tables
ALTER TABLE instrument_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_media_types ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for instrument_categories table
CREATE POLICY "instrument_categories_select_policy" ON instrument_categories
    FOR SELECT USING (true);

CREATE POLICY "instrument_categories_insert_policy" ON instrument_categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "instrument_categories_update_policy" ON instrument_categories
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "instrument_categories_delete_policy" ON instrument_categories
    FOR DELETE USING (auth.role() = 'authenticated');

-- 10. Create RLS policies for instruments table
CREATE POLICY "instruments_select_policy" ON instruments
    FOR SELECT USING (true);

CREATE POLICY "instruments_insert_policy" ON instruments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "instruments_update_policy" ON instruments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "instruments_delete_policy" ON instruments
    FOR DELETE USING (auth.role() = 'authenticated');

-- 11. Create RLS policies for track_instruments table
CREATE POLICY "track_instruments_select_policy" ON track_instruments
    FOR SELECT USING (true);

CREATE POLICY "track_instruments_insert_policy" ON track_instruments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "track_instruments_update_policy" ON track_instruments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "track_instruments_delete_policy" ON track_instruments
    FOR DELETE USING (auth.role() = 'authenticated');

-- 12. Create RLS policies for media_categories table
CREATE POLICY "media_categories_select_policy" ON media_categories
    FOR SELECT USING (true);

CREATE POLICY "media_categories_insert_policy" ON media_categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "media_categories_update_policy" ON media_categories
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "media_categories_delete_policy" ON media_categories
    FOR DELETE USING (auth.role() = 'authenticated');

-- 13. Create RLS policies for media_types table
CREATE POLICY "media_types_select_policy" ON media_types
    FOR SELECT USING (true);

CREATE POLICY "media_types_insert_policy" ON media_types
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "media_types_update_policy" ON media_types
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "media_types_delete_policy" ON media_types
    FOR DELETE USING (auth.role() = 'authenticated');

-- 14. Create RLS policies for track_media_types table
CREATE POLICY "track_media_types_select_policy" ON track_media_types
    FOR SELECT USING (true);

CREATE POLICY "track_media_types_insert_policy" ON track_media_types
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "track_media_types_update_policy" ON track_media_types
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "track_media_types_delete_policy" ON track_media_types
    FOR DELETE USING (auth.role() = 'authenticated');

-- 15. Insert main instrument categories
INSERT INTO instrument_categories (name, display_name, display_order) VALUES
('strings', 'Strings', 1),
('woodwinds', 'Woodwinds', 2),
('brass', 'Brass', 3),
('percussion', 'Percussion', 4),
('keyboards', 'Keyboards', 5),
('guitars', 'Guitars', 6),
('bass', 'Bass', 7),
('drums', 'Drums', 8),
('vocals', 'Vocals', 9),
('electronic', 'Electronic', 10),
('world', 'World Instruments', 11),
('other', 'Other', 12)
ON CONFLICT (name) DO NOTHING;

-- 16. Insert instruments for each category
-- Strings
INSERT INTO instruments (category_id, name, display_name, display_order)
SELECT ic.id, inst.name, inst.display_name, inst.display_order
FROM instrument_categories ic
CROSS JOIN (VALUES
    ('violin', 'Violin', 1),
    ('viola', 'Viola', 2),
    ('cello', 'Cello', 3),
    ('double_bass', 'Double Bass', 4),
    ('harp', 'Harp', 5),
    ('guitar', 'Guitar', 6),
    ('acoustic_guitar', 'Acoustic Guitar', 7),
    ('electric_guitar', 'Electric Guitar', 8),
    ('bass_guitar', 'Bass Guitar', 9),
    ('ukulele', 'Ukulele', 10),
    ('banjo', 'Banjo', 11),
    ('mandolin', 'Mandolin', 12)
) AS inst(name, display_name, display_order)
WHERE ic.name = 'strings'
ON CONFLICT (category_id, name) DO NOTHING;

-- Woodwinds
INSERT INTO instruments (category_id, name, display_name, display_order)
SELECT ic.id, inst.name, inst.display_name, inst.display_order
FROM instrument_categories ic
CROSS JOIN (VALUES
    ('flute', 'Flute', 1),
    ('clarinet', 'Clarinet', 2),
    ('oboe', 'Oboe', 3),
    ('bassoon', 'Bassoon', 4),
    ('saxophone', 'Saxophone', 5),
    ('alto_sax', 'Alto Saxophone', 6),
    ('tenor_sax', 'Tenor Saxophone', 7),
    ('baritone_sax', 'Baritone Saxophone', 8),
    ('piccolo', 'Piccolo', 9),
    ('recorder', 'Recorder', 10)
) AS inst(name, display_name, display_order)
WHERE ic.name = 'woodwinds'
ON CONFLICT (category_id, name) DO NOTHING;

-- Brass
INSERT INTO instruments (category_id, name, display_name, display_order)
SELECT ic.id, inst.name, inst.display_name, inst.display_order
FROM instrument_categories ic
CROSS JOIN (VALUES
    ('trumpet', 'Trumpet', 1),
    ('trombone', 'Trombone', 2),
    ('french_horn', 'French Horn', 3),
    ('tuba', 'Tuba', 4),
    ('cornet', 'Cornet', 5),
    ('euphonium', 'Euphonium', 6),
    ('flugelhorn', 'Flugelhorn', 7)
) AS inst(name, display_name, display_order)
WHERE ic.name = 'brass'
ON CONFLICT (category_id, name) DO NOTHING;

-- Percussion
INSERT INTO instruments (category_id, name, display_name, display_order)
SELECT ic.id, inst.name, inst.display_name, inst.display_order
FROM instrument_categories ic
CROSS JOIN (VALUES
    ('drums', 'Drums', 1),
    ('snare_drum', 'Snare Drum', 2),
    ('bass_drum', 'Bass Drum', 3),
    ('tom_toms', 'Tom Toms', 4),
    ('cymbals', 'Cymbals', 5),
    ('hi_hat', 'Hi-Hat', 6),
    ('crash_cymbal', 'Crash Cymbal', 7),
    ('ride_cymbal', 'Ride Cymbal', 8),
    ('tambourine', 'Tambourine', 9),
    ('maracas', 'Maracas', 10),
    ('cowbell', 'Cowbell', 11),
    ('triangle', 'Triangle', 12),
    ('xylophone', 'Xylophone', 13),
    ('vibraphone', 'Vibraphone', 14),
    ('timpani', 'Timpani', 15),
    ('bongos', 'Bongos', 16),
    ('congas', 'Congas', 17),
    ('djembe', 'Djembe', 18)
) AS inst(name, display_name, display_order)
WHERE ic.name = 'percussion'
ON CONFLICT (category_id, name) DO NOTHING;

-- Keyboards
INSERT INTO instruments (category_id, name, display_name, display_order)
SELECT ic.id, inst.name, inst.display_name, inst.display_order
FROM instrument_categories ic
CROSS JOIN (VALUES
    ('piano', 'Piano', 1),
    ('grand_piano', 'Grand Piano', 2),
    ('upright_piano', 'Upright Piano', 3),
    ('electric_piano', 'Electric Piano', 4),
    ('organ', 'Organ', 5),
    ('hammond_organ', 'Hammond Organ', 6),
    ('synthesizer', 'Synthesizer', 7),
    ('keyboard', 'Keyboard', 8),
    ('accordion', 'Accordion', 9),
    ('harmonica', 'Harmonica', 10),
    ('melodica', 'Melodica', 11)
) AS inst(name, display_name, display_order)
WHERE ic.name = 'keyboards'
ON CONFLICT (category_id, name) DO NOTHING;

-- Guitars
INSERT INTO instruments (category_id, name, display_name, display_order)
SELECT ic.id, inst.name, inst.display_name, inst.display_order
FROM instrument_categories ic
CROSS JOIN (VALUES
    ('acoustic_guitar', 'Acoustic Guitar', 1),
    ('electric_guitar', 'Electric Guitar', 2),
    ('classical_guitar', 'Classical Guitar', 3),
    ('steel_string_guitar', 'Steel String Guitar', 4),
    ('nylon_string_guitar', 'Nylon String Guitar', 5),
    ('12_string_guitar', '12-String Guitar', 6),
    ('bass_guitar', 'Bass Guitar', 7),
    ('electric_bass', 'Electric Bass', 8),
    ('acoustic_bass', 'Acoustic Bass', 9),
    ('ukulele', 'Ukulele', 10),
    ('banjo', 'Banjo', 11),
    ('mandolin', 'Mandolin', 12),
    ('lap_steel', 'Lap Steel', 13),
    ('pedal_steel', 'Pedal Steel', 14)
) AS inst(name, display_name, display_order)
WHERE ic.name = 'guitars'
ON CONFLICT (category_id, name) DO NOTHING;

-- Bass
INSERT INTO instruments (category_id, name, display_name, display_order)
SELECT ic.id, inst.name, inst.display_name, inst.display_order
FROM instrument_categories ic
CROSS JOIN (VALUES
    ('bass_guitar', 'Bass Guitar', 1),
    ('electric_bass', 'Electric Bass', 2),
    ('acoustic_bass', 'Acoustic Bass', 3),
    ('upright_bass', 'Upright Bass', 4),
    ('double_bass', 'Double Bass', 5),
    ('fretless_bass', 'Fretless Bass', 6),
    ('5_string_bass', '5-String Bass', 7),
    ('6_string_bass', '6-String Bass', 8)
) AS inst(name, display_name, display_order)
WHERE ic.name = 'bass'
ON CONFLICT (category_id, name) DO NOTHING;

-- Drums
INSERT INTO instruments (category_id, name, display_name, display_order)
SELECT ic.id, inst.name, inst.display_name, inst.display_order
FROM instrument_categories ic
CROSS JOIN (VALUES
    ('drum_kit', 'Drum Kit', 1),
    ('snare_drum', 'Snare Drum', 2),
    ('bass_drum', 'Bass Drum', 3),
    ('tom_toms', 'Tom Toms', 4),
    ('floor_tom', 'Floor Tom', 5),
    ('rack_toms', 'Rack Toms', 6),
    ('cymbals', 'Cymbals', 7),
    ('hi_hat', 'Hi-Hat', 8),
    ('crash_cymbal', 'Crash Cymbal', 9),
    ('ride_cymbal', 'Ride Cymbal', 10),
    ('splash_cymbal', 'Splash Cymbal', 11),
    ('china_cymbal', 'China Cymbal', 12),
    ('tambourine', 'Tambourine', 13),
    ('cowbell', 'Cowbell', 14),
    ('wood_block', 'Wood Block', 15)
) AS inst(name, display_name, display_order)
WHERE ic.name = 'drums'
ON CONFLICT (category_id, name) DO NOTHING;

-- Vocals
INSERT INTO instruments (category_id, name, display_name, display_order)
SELECT ic.id, inst.name, inst.display_name, inst.display_order
FROM instrument_categories ic
CROSS JOIN (VALUES
    ('lead_vocals', 'Lead Vocals', 1),
    ('backing_vocals', 'Backing Vocals', 2),
    ('harmony_vocals', 'Harmony Vocals', 3),
    ('choir', 'Choir', 4),
    ('rap', 'Rap', 5),
    ('spoken_word', 'Spoken Word', 6),
    ('beatboxing', 'Beatboxing', 7),
    ('whistling', 'Whistling', 8)
) AS inst(name, display_name, display_order)
WHERE ic.name = 'vocals'
ON CONFLICT (category_id, name) DO NOTHING;

-- Electronic
INSERT INTO instruments (category_id, name, display_name, display_order)
SELECT ic.id, inst.name, inst.display_name, inst.display_order
FROM instrument_categories ic
CROSS JOIN (VALUES
    ('synthesizer', 'Synthesizer', 1),
    ('drum_machine', 'Drum Machine', 2),
    ('sampler', 'Sampler', 3),
    ('sequencer', 'Sequencer', 4),
    ('effects_pedal', 'Effects Pedal', 5),
    ('delay', 'Delay', 6),
    ('reverb', 'Reverb', 7),
    ('distortion', 'Distortion', 8),
    ('compression', 'Compression', 9),
    ('filter', 'Filter', 10),
    ('modulation', 'Modulation', 11),
    ('looper', 'Looper', 12)
) AS inst(name, display_name, display_order)
WHERE ic.name = 'electronic'
ON CONFLICT (category_id, name) DO NOTHING;

-- World Instruments
INSERT INTO instruments (category_id, name, display_name, display_order)
SELECT ic.id, inst.name, inst.display_name, inst.display_order
FROM instrument_categories ic
CROSS JOIN (VALUES
    ('sitar', 'Sitar', 1),
    ('tabla', 'Tabla', 2),
    ('djembe', 'Djembe', 3),
    ('kora', 'Kora', 4),
    ('kalimba', 'Kalimba', 5),
    ('didgeridoo', 'Didgeridoo', 6),
    ('bagpipes', 'Bagpipes', 7),
    ('accordion', 'Accordion', 8),
    ('harmonica', 'Harmonica', 9),
    ('steel_drum', 'Steel Drum', 10),
    ('gong', 'Gong', 11),
    ('chimes', 'Chimes', 12)
) AS inst(name, display_name, display_order)
WHERE ic.name = 'world'
ON CONFLICT (category_id, name) DO NOTHING;

-- Other
INSERT INTO instruments (category_id, name, display_name, display_order)
SELECT ic.id, inst.name, inst.display_name, inst.display_order
FROM instrument_categories ic
CROSS JOIN (VALUES
    ('sound_effects', 'Sound Effects', 1),
    ('field_recordings', 'Field Recordings', 2),
    ('found_objects', 'Found Objects', 3),
    ('body_percussion', 'Body Percussion', 4),
    ('clapping', 'Clapping', 5),
    ('finger_snapping', 'Finger Snapping', 6),
    ('foot_stomping', 'Foot Stomping', 7)
) AS inst(name, display_name, display_order)
WHERE ic.name = 'other'
ON CONFLICT (category_id, name) DO NOTHING;

-- 17. Insert main media categories
INSERT INTO media_categories (name, display_name, display_order) VALUES
('film_tv', 'Film & TV', 1),
('advertising', 'Advertising', 2),
('gaming', 'Gaming', 3),
('podcasts', 'Podcasts', 4),
('streaming', 'Streaming', 5),
('live_events', 'Live Events', 6),
('corporate', 'Corporate', 7),
('educational', 'Educational', 8),
('other_media', 'Other Media', 9)
ON CONFLICT (name) DO NOTHING;

-- 18. Insert media types for each category
-- Film & TV
INSERT INTO media_types (category_id, name, display_name, display_order)
SELECT mc.id, mt.name, mt.display_name, mt.display_order
FROM media_categories mc
CROSS JOIN (VALUES
    ('feature_film', 'Feature Film', 1),
    ('short_film', 'Short Film', 2),
    ('documentary', 'Documentary', 3),
    ('tv_series', 'TV Series', 4),
    ('tv_show', 'TV Show', 5),
    ('reality_tv', 'Reality TV', 6),
    ('news', 'News', 7),
    ('sports', 'Sports', 8),
    ('commercial', 'Commercial', 9),
    ('trailer', 'Trailer', 10),
    ('credits', 'Credits', 11),
    ('background_music', 'Background Music', 12)
) AS mt(name, display_name, display_order)
WHERE mc.name = 'film_tv'
ON CONFLICT (category_id, name) DO NOTHING;

-- Advertising
INSERT INTO media_types (category_id, name, display_name, display_order)
SELECT mc.id, mt.name, mt.display_name, mt.display_order
FROM media_categories mc
CROSS JOIN (VALUES
    ('tv_ad', 'TV Advertisement', 1),
    ('radio_ad', 'Radio Advertisement', 2),
    ('online_ad', 'Online Advertisement', 3),
    ('social_media_ad', 'Social Media Ad', 4),
    ('billboard', 'Billboard', 5),
    ('print_ad', 'Print Advertisement', 6),
    ('product_launch', 'Product Launch', 7),
    ('brand_campaign', 'Brand Campaign', 8),
    ('jingle', 'Jingle', 9)
) AS mt(name, display_name, display_order)
WHERE mc.name = 'advertising'
ON CONFLICT (category_id, name) DO NOTHING;

-- Gaming
INSERT INTO media_types (category_id, name, display_name, display_order)
SELECT mc.id, mt.name, mt.display_name, mt.display_order
FROM media_categories mc
CROSS JOIN (VALUES
    ('video_game', 'Video Game', 1),
    ('mobile_game', 'Mobile Game', 2),
    ('pc_game', 'PC Game', 3),
    ('console_game', 'Console Game', 4),
    ('game_trailer', 'Game Trailer', 5),
    ('game_menu', 'Game Menu', 6),
    ('cutscene', 'Cutscene', 7),
    ('boss_battle', 'Boss Battle', 8),
    ('level_music', 'Level Music', 9),
    ('character_theme', 'Character Theme', 10)
) AS mt(name, display_name, display_order)
WHERE mc.name = 'gaming'
ON CONFLICT (category_id, name) DO NOTHING;

-- Podcasts
INSERT INTO media_types (category_id, name, display_name, display_order)
SELECT mc.id, mt.name, mt.display_name, mt.display_order
FROM media_categories mc
CROSS JOIN (VALUES
    ('podcast_intro', 'Podcast Intro', 1),
    ('podcast_outro', 'Podcast Outro', 2),
    ('podcast_transition', 'Podcast Transition', 3),
    ('podcast_background', 'Podcast Background', 4),
    ('podcast_ad', 'Podcast Advertisement', 5),
    ('podcast_series', 'Podcast Series', 6)
) AS mt(name, display_name, display_order)
WHERE mc.name = 'podcasts'
ON CONFLICT (category_id, name) DO NOTHING;

-- Streaming
INSERT INTO media_types (category_id, name, display_name, display_order)
SELECT mc.id, mt.name, mt.display_name, mt.display_order
FROM media_categories mc
CROSS JOIN (VALUES
    ('streaming_platform', 'Streaming Platform', 1),
    ('youtube', 'YouTube', 2),
    ('netflix', 'Netflix', 3),
    ('spotify', 'Spotify', 4),
    ('apple_music', 'Apple Music', 5),
    ('amazon_music', 'Amazon Music', 6),
    ('tidal', 'Tidal', 7),
    ('soundcloud', 'SoundCloud', 8),
    ('bandcamp', 'Bandcamp', 9),
    ('twitch', 'Twitch', 10)
) AS mt(name, display_name, display_order)
WHERE mc.name = 'streaming'
ON CONFLICT (category_id, name) DO NOTHING;

-- Live Events
INSERT INTO media_types (category_id, name, display_name, display_order)
SELECT mc.id, mt.name, mt.display_name, mt.display_order
FROM media_categories mc
CROSS JOIN (VALUES
    ('concert', 'Concert', 1),
    ('festival', 'Festival', 2),
    ('wedding', 'Wedding', 3),
    ('corporate_event', 'Corporate Event', 4),
    ('conference', 'Conference', 5),
    ('sports_event', 'Sports Event', 6),
    ('theater', 'Theater', 7),
    ('dance_performance', 'Dance Performance', 8),
    ('graduation', 'Graduation', 9),
    ('party', 'Party', 10)
) AS mt(name, display_name, display_order)
WHERE mc.name = 'live_events'
ON CONFLICT (category_id, name) DO NOTHING;

-- Corporate
INSERT INTO media_types (category_id, name, display_name, display_order)
SELECT mc.id, mt.name, mt.display_name, mt.display_order
FROM media_categories mc
CROSS JOIN (VALUES
    ('presentation', 'Presentation', 1),
    ('training_video', 'Training Video', 2),
    ('company_video', 'Company Video', 3),
    ('internal_communication', 'Internal Communication', 4),
    ('brand_video', 'Brand Video', 5),
    ('product_demo', 'Product Demo', 6),
    ('annual_report', 'Annual Report', 7),
    ('shareholder_meeting', 'Shareholder Meeting', 8)
) AS mt(name, display_name, display_order)
WHERE mc.name = 'corporate'
ON CONFLICT (category_id, name) DO NOTHING;

-- Educational
INSERT INTO media_types (category_id, name, display_name, display_order)
SELECT mc.id, mt.name, mt.display_name, mt.display_order
FROM media_categories mc
CROSS JOIN (VALUES
    ('online_course', 'Online Course', 1),
    ('tutorial', 'Tutorial', 2),
    ('lecture', 'Lecture', 3),
    ('educational_video', 'Educational Video', 4),
    ('language_learning', 'Language Learning', 5),
    ('children_education', 'Children Education', 6),
    ('science_video', 'Science Video', 7),
    ('history_documentary', 'History Documentary', 8)
) AS mt(name, display_name, display_order)
WHERE mc.name = 'educational'
ON CONFLICT (category_id, name) DO NOTHING;

-- Other Media
INSERT INTO media_types (category_id, name, display_name, display_order)
SELECT mc.id, mt.name, mt.display_name, mt.display_order
FROM media_categories mc
CROSS JOIN (VALUES
    ('demo', 'Demo', 1),
    ('remix', 'Remix', 2),
    ('cover', 'Cover', 3),
    ('mashup', 'Mashup', 4),
    ('soundtrack', 'Soundtrack', 5),
    ('compilation', 'Compilation', 6),
    ('mixtape', 'Mixtape', 7),
    ('playlist', 'Playlist', 8),
    ('background_music', 'Background Music', 9),
    ('ambient', 'Ambient', 10)
) AS mt(name, display_name, display_order)
WHERE mc.name = 'other_media'
ON CONFLICT (category_id, name) DO NOTHING;

-- Success message
SELECT 'Instruments and Media Types tables created successfully! You can now use the new dynamic structure.' as status;
