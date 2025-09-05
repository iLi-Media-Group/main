-- Insert instruments data only (tables and policies already exist)
-- Run this in your Supabase SQL Editor

-- Insert default instruments (skip if already exist)
INSERT INTO instruments (name, display_name) VALUES
  ('strings', 'Strings'),
  ('brass', 'Brass'),
  ('woodwind', 'Woodwind'),
  ('percussion', 'Percussion'),
  ('keyboard', 'Keyboard'),
  ('guitar', 'Guitar'),
  ('bass', 'Bass'),
  ('drums', 'Drums'),
  ('vocals', 'Vocals'),
  ('electronic', 'Electronic')
ON CONFLICT (name) DO NOTHING;

-- Insert sub-instruments for each category (skip if already exist)
INSERT INTO sub_instruments (instrument_id, name, display_name) 
SELECT i.id, 'violin', 'Violin' FROM instruments i WHERE i.name = 'strings'
UNION ALL
SELECT i.id, 'viola', 'Viola' FROM instruments i WHERE i.name = 'strings'
UNION ALL
SELECT i.id, 'cello', 'Cello' FROM instruments i WHERE i.name = 'strings'
UNION ALL
SELECT i.id, 'double_bass', 'Double Bass' FROM instruments i WHERE i.name = 'strings'
UNION ALL
SELECT i.id, 'trumpet', 'Trumpet' FROM instruments i WHERE i.name = 'brass'
UNION ALL
SELECT i.id, 'trombone', 'Trombone' FROM instruments i WHERE i.name = 'brass'
UNION ALL
SELECT i.id, 'french_horn', 'French Horn' FROM instruments i WHERE i.name = 'brass'
UNION ALL
SELECT i.id, 'tuba', 'Tuba' FROM instruments i WHERE i.name = 'brass'
UNION ALL
SELECT i.id, 'flute', 'Flute' FROM instruments i WHERE i.name = 'woodwind'
UNION ALL
SELECT i.id, 'clarinet', 'Clarinet' FROM instruments i WHERE i.name = 'woodwind'
UNION ALL
SELECT i.id, 'oboe', 'Oboe' FROM instruments i WHERE i.name = 'woodwind'
UNION ALL
SELECT i.id, 'bassoon', 'Bassoon' FROM instruments i WHERE i.name = 'woodwind'
UNION ALL
SELECT i.id, 'drums', 'Drums' FROM instruments i WHERE i.name = 'percussion'
UNION ALL
SELECT i.id, 'cymbals', 'Cymbals' FROM instruments i WHERE i.name = 'percussion'
UNION ALL
SELECT i.id, 'timpani', 'Timpani' FROM instruments i WHERE i.name = 'percussion'
UNION ALL
SELECT i.id, 'piano', 'Piano' FROM instruments i WHERE i.name = 'keyboard'
UNION ALL
SELECT i.id, 'organ', 'Organ' FROM instruments i WHERE i.name = 'keyboard'
UNION ALL
SELECT i.id, 'synthesizer', 'Synthesizer' FROM instruments i WHERE i.name = 'keyboard'
UNION ALL
SELECT i.id, 'acoustic_guitar', 'Acoustic Guitar' FROM instruments i WHERE i.name = 'guitar'
UNION ALL
SELECT i.id, 'electric_guitar', 'Electric Guitar' FROM instruments i WHERE i.name = 'guitar'
UNION ALL
SELECT i.id, 'classical_guitar', 'Classical Guitar' FROM instruments i WHERE i.name = 'guitar'
UNION ALL
SELECT i.id, 'acoustic_bass', 'Acoustic Bass' FROM instruments i WHERE i.name = 'bass'
UNION ALL
SELECT i.id, 'electric_bass', 'Electric Bass' FROM instruments i WHERE i.name = 'bass'
UNION ALL
SELECT i.id, 'upright_bass', 'Upright Bass' FROM instruments i WHERE i.name = 'bass'
UNION ALL
SELECT i.id, 'drum_kit', 'Drum Kit' FROM instruments i WHERE i.name = 'drums'
UNION ALL
SELECT i.id, 'electronic_drums', 'Electronic Drums' FROM instruments i WHERE i.name = 'drums'
UNION ALL
SELECT i.id, 'lead_vocals', 'Lead Vocals' FROM instruments i WHERE i.name = 'vocals'
UNION ALL
SELECT i.id, 'backing_vocals', 'Backing Vocals' FROM instruments i WHERE i.name = 'vocals'
UNION ALL
SELECT i.id, 'choir', 'Choir' FROM instruments i WHERE i.name = 'vocals'
UNION ALL
SELECT i.id, 'drum_machine', 'Drum Machine' FROM instruments i WHERE i.name = 'electronic'
UNION ALL
SELECT i.id, 'sampler', 'Sampler' FROM instruments i WHERE i.name = 'electronic'
UNION ALL
SELECT i.id, 'sequencer', 'Sequencer' FROM instruments i WHERE i.name = 'electronic'
ON CONFLICT (instrument_id, name) DO NOTHING;
