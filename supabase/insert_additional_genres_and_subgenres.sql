-- Insert additional genres and subgenres for music licensing
-- Run this in your Supabase SQL editor

-- HIP-HOP / RAP
INSERT INTO genres (name, display_name) SELECT 'hip_hop_rap', 'Hip-Hop / Rap' WHERE NOT EXISTS (SELECT 1 FROM genres WHERE name = 'hip_hop_rap');

INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'old_school', 'Old School' FROM genres g WHERE g.name = 'hip_hop_rap' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'boom_bap', 'Boom Bap' FROM genres g WHERE g.name = 'hip_hop_rap' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'trap', 'Trap' FROM genres g WHERE g.name = 'hip_hop_rap' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'drill', 'Drill' FROM genres g WHERE g.name = 'hip_hop_rap' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'lo_fi_hip_hop', 'Lo-fi Hip-Hop' FROM genres g WHERE g.name = 'hip_hop_rap' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'conscious_rap', 'Conscious Rap' FROM genres g WHERE g.name = 'hip_hop_rap' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'west_coast_gfunk', 'West Coast / G-Funk' FROM genres g WHERE g.name = 'hip_hop_rap' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'east_coast', 'East Coast' FROM genres g WHERE g.name = 'hip_hop_rap' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'dirty_south', 'Dirty South' FROM genres g WHERE g.name = 'hip_hop_rap' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'grime', 'Grime' FROM genres g WHERE g.name = 'hip_hop_rap' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'alternative_hip_hop', 'Alternative Hip-Hop' FROM genres g WHERE g.name = 'hip_hop_rap' ON CONFLICT DO NOTHING;

-- R&B / SOUL
INSERT INTO genres (name, display_name) SELECT 'rnb_soul', 'R&B / Soul' WHERE NOT EXISTS (SELECT 1 FROM genres WHERE name = 'rnb_soul');
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'contemporary_rnb', 'Contemporary R&B' FROM genres g WHERE g.name = 'rnb_soul' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'neo_soul', 'Neo-Soul' FROM genres g WHERE g.name = 'rnb_soul' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'quiet_storm', 'Quiet Storm' FROM genres g WHERE g.name = 'rnb_soul' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'funk', 'Funk' FROM genres g WHERE g.name = 'rnb_soul' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'motown', 'Motown' FROM genres g WHERE g.name = 'rnb_soul' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'classic_soul', 'Classic Soul' FROM genres g WHERE g.name = 'rnb_soul' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'indie_rnb', 'Indie R&B' FROM genres g WHERE g.name = 'rnb_soul' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'bedroom_rnb', 'Bedroom R&B' FROM genres g WHERE g.name = 'rnb_soul' ON CONFLICT DO NOTHING;

-- POP
INSERT INTO genres (name, display_name) SELECT 'pop', 'Pop' WHERE NOT EXISTS (SELECT 1 FROM genres WHERE name = 'pop');
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'electropop', 'Electropop' FROM genres g WHERE g.name = 'pop' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'dance_pop', 'Dance Pop' FROM genres g WHERE g.name = 'pop' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'indie_pop', 'Indie Pop' FROM genres g WHERE g.name = 'pop' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'k_pop', 'K-Pop' FROM genres g WHERE g.name = 'pop' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'synthpop', 'Synthpop' FROM genres g WHERE g.name = 'pop' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'teen_pop', 'Teen Pop' FROM genres g WHERE g.name = 'pop' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'power_pop', 'Power Pop' FROM genres g WHERE g.name = 'pop' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'art_pop', 'Art Pop' FROM genres g WHERE g.name = 'pop' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'hyperpop', 'Hyperpop' FROM genres g WHERE g.name = 'pop' ON CONFLICT DO NOTHING;

-- ROCK
INSERT INTO genres (name, display_name) SELECT 'rock', 'Rock' WHERE NOT EXISTS (SELECT 1 FROM genres WHERE name = 'rock');
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'indie_rock', 'Indie Rock' FROM genres g WHERE g.name = 'rock' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'alternative_rock', 'Alternative Rock' FROM genres g WHERE g.name = 'rock' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'classic_rock', 'Classic Rock' FROM genres g WHERE g.name = 'rock' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'psychedelic_rock', 'Psychedelic Rock' FROM genres g WHERE g.name = 'rock' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'pop_rock', 'Pop Rock' FROM genres g WHERE g.name = 'rock' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'garage_rock', 'Garage Rock' FROM genres g WHERE g.name = 'rock' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'hard_rock', 'Hard Rock' FROM genres g WHERE g.name = 'rock' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'punk_rock', 'Punk Rock' FROM genres g WHERE g.name = 'rock' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'progressive_rock', 'Progressive Rock' FROM genres g WHERE g.name = 'rock' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'metal', 'Metal (Heavy, Death, Black, etc.)' FROM genres g WHERE g.name = 'rock' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'emo_post_hardcore', 'Emo / Post-Hardcore' FROM genres g WHERE g.name = 'rock' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'ska', 'Ska' FROM genres g WHERE g.name = 'rock' ON CONFLICT DO NOTHING;

-- ELECTRONIC / DANCE
INSERT INTO genres (name, display_name) SELECT 'electronic_dance', 'Electronic / Dance' WHERE NOT EXISTS (SELECT 1 FROM genres WHERE name = 'electronic_dance');
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'edm', 'EDM' FROM genres g WHERE g.name = 'electronic_dance' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'house', 'House (Deep, Tech, Electro, Tropical)' FROM genres g WHERE g.name = 'electronic_dance' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'techno', 'Techno' FROM genres g WHERE g.name = 'electronic_dance' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'drum_and_bass', 'Drum and Bass (DNB)' FROM genres g WHERE g.name = 'electronic_dance' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'jungle', 'Jungle' FROM genres g WHERE g.name = 'electronic_dance' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'dubstep', 'Dubstep' FROM genres g WHERE g.name = 'electronic_dance' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'trance', 'Trance (Progressive, Psytrance)' FROM genres g WHERE g.name = 'electronic_dance' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'chillstep_chillwave', 'Chillstep / Chillwave' FROM genres g WHERE g.name = 'electronic_dance' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'synthwave_retrowave', 'Synthwave / Retrowave' FROM genres g WHERE g.name = 'electronic_dance' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'future_bass', 'Future Bass' FROM genres g WHERE g.name = 'electronic_dance' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'big_room', 'Big Room' FROM genres g WHERE g.name = 'electronic_dance' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'idm', 'IDM (Intelligent Dance Music)' FROM genres g WHERE g.name = 'electronic_dance' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'ambient_electronic', 'Ambient Electronic' FROM genres g WHERE g.name = 'electronic_dance' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'glitch', 'Glitch' FROM genres g WHERE g.name = 'electronic_dance' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'bass_music', 'Bass Music' FROM genres g WHERE g.name = 'electronic_dance' ON CONFLICT DO NOTHING;

-- JAZZ
INSERT INTO genres (name, display_name) SELECT 'jazz', 'Jazz' WHERE NOT EXISTS (SELECT 1 FROM genres WHERE name = 'jazz');
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'smooth_jazz', 'Smooth Jazz' FROM genres g WHERE g.name = 'jazz' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'bebop', 'Bebop' FROM genres g WHERE g.name = 'jazz' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'hard_bop', 'Hard Bop' FROM genres g WHERE g.name = 'jazz' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'cool_jazz', 'Cool Jazz' FROM genres g WHERE g.name = 'jazz' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'acid_jazz', 'Acid Jazz' FROM genres g WHERE g.name = 'jazz' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'fusion', 'Fusion' FROM genres g WHERE g.name = 'jazz' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'swing', 'Swing' FROM genres g WHERE g.name = 'jazz' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'vocal_jazz', 'Vocal Jazz' FROM genres g WHERE g.name = 'jazz' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'free_jazz', 'Free Jazz' FROM genres g WHERE g.name = 'jazz' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'latin_jazz', 'Latin Jazz' FROM genres g WHERE g.name = 'jazz' ON CONFLICT DO NOTHING;

-- CLASSICAL / ORCHESTRAL
INSERT INTO genres (name, display_name) SELECT 'classical_orchestral', 'Classical / Orchestral' WHERE NOT EXISTS (SELECT 1 FROM genres WHERE name = 'classical_orchestral');
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'baroque', 'Baroque' FROM genres g WHERE g.name = 'classical_orchestral' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'romantic', 'Romantic' FROM genres g WHERE g.name = 'classical_orchestral' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'modern_classical', 'Modern Classical' FROM genres g WHERE g.name = 'classical_orchestral' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'solo_instrumental', 'Solo Instrumental (Piano, Violin, etc.)' FROM genres g WHERE g.name = 'classical_orchestral' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'symphonic_cinematic', 'Symphonic / Cinematic' FROM genres g WHERE g.name = 'classical_orchestral' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'minimalism', 'Minimalism' FROM genres g WHERE g.name = 'classical_orchestral' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'chamber_music', 'Chamber Music' FROM genres g WHERE g.name = 'classical_orchestral' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'avant_garde', 'Avant-Garde' FROM genres g WHERE g.name = 'classical_orchestral' ON CONFLICT DO NOTHING;

-- WORLD / GLOBAL
INSERT INTO genres (name, display_name) SELECT 'world_global', 'World / Global' WHERE NOT EXISTS (SELECT 1 FROM genres WHERE name = 'world_global');
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'afrobeats', 'Afrobeats' FROM genres g WHERE g.name = 'world_global' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'afrobeat', 'Afrobeat (Fela Kuti-style)' FROM genres g WHERE g.name = 'world_global' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'reggae', 'Reggae' FROM genres g WHERE g.name = 'world_global' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'dancehall', 'Dancehall' FROM genres g WHERE g.name = 'world_global' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'soca', 'Soca' FROM genres g WHERE g.name = 'world_global' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'latin_pop', 'Latin Pop' FROM genres g WHERE g.name = 'world_global' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'cumbia', 'Cumbia' FROM genres g WHERE g.name = 'world_global' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'samba_bossa_nova', 'Samba / Bossa Nova' FROM genres g WHERE g.name = 'world_global' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'klezmer', 'Klezmer' FROM genres g WHERE g.name = 'world_global' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'indian_classical_bollywood', 'Indian Classical / Bollywood' FROM genres g WHERE g.name = 'world_global' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'middle_eastern', 'Middle Eastern' FROM genres g WHERE g.name = 'world_global' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'asian_traditional', 'Asian Traditional (e.g., Gamelan, Japanese Shamisen)' FROM genres g WHERE g.name = 'world_global' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'afro_cuban_salsa', 'Afro-Cuban / Salsa' FROM genres g WHERE g.name = 'world_global' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'afro_house', 'Afro-House' FROM genres g WHERE g.name = 'world_global' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'highlife_fuji_makossa', 'Highlife / Fuji / Makossa' FROM genres g WHERE g.name = 'world_global' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'balkan_eastern_european', 'Balkan / Eastern European' FROM genres g WHERE g.name = 'world_global' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'indigenous_tribal_folk_world', 'Indigenous / Tribal / Folk World' FROM genres g WHERE g.name = 'world_global' ON CONFLICT DO NOTHING;

-- RELIGIOUS / INSPIRATIONAL
INSERT INTO genres (name, display_name) SELECT 'religious_inspirational', 'Religious / Inspirational' WHERE NOT EXISTS (SELECT 1 FROM genres WHERE name = 'religious_inspirational');
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'gospel', 'Gospel (Traditional, Urban)' FROM genres g WHERE g.name = 'religious_inspirational' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'christian_contemporary', 'Christian Contemporary' FROM genres g WHERE g.name = 'religious_inspirational' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'worship_praise', 'Worship / Praise' FROM genres g WHERE g.name = 'religious_inspirational' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'islamic_nasheeds', 'Islamic Nasheeds' FROM genres g WHERE g.name = 'religious_inspirational' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'jewish_liturgical', 'Jewish Liturgical' FROM genres g WHERE g.name = 'religious_inspirational' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'meditation_spiritual_mantra', 'Meditation / Spiritual / Mantra' FROM genres g WHERE g.name = 'religious_inspirational' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'hymns_choral', 'Hymns / Choral' FROM genres g WHERE g.name = 'religious_inspirational' ON CONFLICT DO NOTHING;

-- CHILDREN’S / FAMILY
INSERT INTO genres (name, display_name) SELECT 'childrens_family', 'Children’s / Family' WHERE NOT EXISTS (SELECT 1 FROM genres WHERE name = 'childrens_family');
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'nursery_rhymes', 'Nursery Rhymes' FROM genres g WHERE g.name = 'childrens_family' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'kids_pop', 'Kids Pop' FROM genres g WHERE g.name = 'childrens_family' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'educational_songs', 'Educational Songs' FROM genres g WHERE g.name = 'childrens_family' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'lullabies', 'Lullabies' FROM genres g WHERE g.name = 'childrens_family' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'disney_style', 'Disney-style' FROM genres g WHERE g.name = 'childrens_family' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'singalong', 'Singalong' FROM genres g WHERE g.name = 'childrens_family' ON CONFLICT DO NOTHING;

-- COUNTRY / FOLK / AMERICANA
INSERT INTO genres (name, display_name) SELECT 'country_folk_americana', 'Country / Folk / Americana' WHERE NOT EXISTS (SELECT 1 FROM genres WHERE name = 'country_folk_americana');
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'classic_country', 'Classic Country' FROM genres g WHERE g.name = 'country_folk_americana' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'pop_country', 'Pop Country' FROM genres g WHERE g.name = 'country_folk_americana' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'outlaw_country', 'Outlaw Country' FROM genres g WHERE g.name = 'country_folk_americana' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'bluegrass', 'Bluegrass' FROM genres g WHERE g.name = 'country_folk_americana' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'americana', 'Americana' FROM genres g WHERE g.name = 'country_folk_americana' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'folk', 'Folk (Traditional, Indie)' FROM genres g WHERE g.name = 'country_folk_americana' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'country_rock', 'Country Rock' FROM genres g WHERE g.name = 'country_folk_americana' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'alt_country', 'Alt-Country' FROM genres g WHERE g.name = 'country_folk_americana' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'honky_tonk', 'Honky Tonk' FROM genres g WHERE g.name = 'country_folk_americana' ON CONFLICT DO NOTHING;

-- OTHER USEFUL LICENSING GENRES
INSERT INTO genres (name, display_name) SELECT 'other_licensing', 'Other Useful Licensing Genres' WHERE NOT EXISTS (SELECT 1 FROM genres WHERE name = 'other_licensing');
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'trailer_epic', 'Trailer / Epic' FROM genres g WHERE g.name = 'other_licensing' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'cinematic_film_score', 'Cinematic / Film Score' FROM genres g WHERE g.name = 'other_licensing' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'lofi_chillhop', 'Lo-fi / Chillhop' FROM genres g WHERE g.name = 'other_licensing' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'meditation_yoga', 'Meditation / Yoga' FROM genres g WHERE g.name = 'other_licensing' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'comedy_quirky', 'Comedy / Quirky' FROM genres g WHERE g.name = 'other_licensing' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'soundtrack_ost', 'Soundtrack / OST' FROM genres g WHERE g.name = 'other_licensing' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'holiday', 'Holiday (Christmas, Halloween, etc.)' FROM genres g WHERE g.name = 'other_licensing' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'sound_effects', 'Sound Effects (FX / Foley)' FROM genres g WHERE g.name = 'other_licensing' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'experimental_noise', 'Experimental / Noise' FROM genres g WHERE g.name = 'other_licensing' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'spoken_word_poetry', 'Spoken Word / Poetry' FROM genres g WHERE g.name = 'other_licensing' ON CONFLICT DO NOTHING;
INSERT INTO sub_genres (genre_id, name, display_name) SELECT g.id, 'game_8bit_chiptune', 'Game / 8-bit / Chiptune' FROM genres g WHERE g.name = 'other_licensing' ON CONFLICT DO NOTHING; 