-- Create search tracking + synonyms tables for AI search system

-- 1) Search queries log
CREATE TABLE IF NOT EXISTS public.search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL, -- optional if logged in
  query text NOT NULL,
  genres text[] DEFAULT '{}',
  subgenres text[] DEFAULT '{}',
  moods text[] DEFAULT '{}',
  media_usage_types text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 2) Synonyms table
CREATE TABLE IF NOT EXISTS public.search_synonyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL UNIQUE,
  synonyms text[] NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Helpful indexes for quick lookup
CREATE INDEX IF NOT EXISTS idx_search_synonyms_term ON public.search_synonyms USING btree (term);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON public.search_queries USING btree (created_at);

-- Insert initial synonyms data
INSERT INTO public.search_synonyms (term, synonyms) VALUES
-- Genres
('jazz', ARRAY['jazzy', 'smooth', 'groovy', 'swing', 'bluesy', 'soulful']),
('hiphop', ARRAY['rap', 'trap', 'drill', 'grime', 'hip hop', 'hip-hop']),
('electronic', ARRAY['edm', 'techno', 'house', 'trance', 'dubstep', 'electronic dance']),
('rock', ARRAY['rocky', 'guitar', 'electric', 'hard rock', 'classic rock']),
('pop', ARRAY['popular', 'mainstream', 'radio', 'chart']),
('classical', ARRAY['orchestral', 'symphonic', 'orchestra', 'symphony']),
('country', ARRAY['western', 'folk', 'americana', 'bluegrass']),
('rnb', ARRAY['r&b', 'rhythm and blues', 'soul', 'neo soul']),

-- Moods
('energetic', ARRAY['upbeat', 'high energy', 'powerful', 'intense', 'dynamic']),
('peaceful', ARRAY['calm', 'relaxing', 'serene', 'tranquil', 'soothing']),
('uplifting', ARRAY['inspiring', 'motivational', 'positive', 'encouraging']),
('dramatic', ARRAY['intense', 'emotional', 'powerful', 'epic']),
('romantic', ARRAY['love', 'passionate', 'intimate', 'sweet']),
('mysterious', ARRAY['dark', 'moody', 'atmospheric', 'haunting']),
('funky', ARRAY['groovy', 'rhythmic', 'danceable']),
('melancholic', ARRAY['sad', 'melancholy', 'sorrowful', 'emotional']),

-- Instruments
('guitar', ARRAY['acoustic guitar', 'electric guitar', 'bass guitar']),
('piano', ARRAY['keyboard', 'keys']),
('drums', ARRAY['drum', 'percussion', 'beat']),
('vocals', ARRAY['voice', 'singing', 'vocal']),
('synth', ARRAY['synthesizer', 'electronic']),
('bass', ARRAY['bass guitar', 'low end']),
('violin', ARRAY['fiddle', 'string']),
('saxophone', ARRAY['sax', 'brass']),

-- Media Types
('television', ARRAY['tv', 'broadcast', 'network']),
('film', ARRAY['movie', 'cinema', 'motion picture']),
('podcast', ARRAY['audio', 'broadcast']),
('youtube', ARRAY['video', 'online']),
('commercial', ARRAY['advertisement', 'ad', 'marketing']),
('gaming', ARRAY['video game', 'game', 'interactive']),
('social', ARRAY['social media', 'instagram', 'tiktok']),
('corporate', ARRAY['business', 'professional'])
ON CONFLICT (term) DO NOTHING;

-- Add RLS policies
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_synonyms ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read synonyms
CREATE POLICY "Allow read access to search synonyms" ON public.search_synonyms
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to insert their own search queries
CREATE POLICY "Allow users to insert their own search queries" ON public.search_queries
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to read their own search queries
CREATE POLICY "Allow users to read their own search queries" ON public.search_queries
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow admins to manage synonyms
CREATE POLICY "Allow admin access to search synonyms" ON public.search_synonyms
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM profiles WHERE account_type = 'admin'
    ));
