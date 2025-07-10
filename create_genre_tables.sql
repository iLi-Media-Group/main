-- Create Genre Management Tables and Insert All Genres/Subgenres
-- Run this script in your Supabase SQL editor to set up everything at once

-- === TABLE CREATION ===

-- Create genres table
CREATE TABLE IF NOT EXISTS genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sub_genres table
CREATE TABLE IF NOT EXISTS sub_genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  genre_id uuid NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(genre_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_genres_name ON genres(name);
CREATE INDEX IF NOT EXISTS idx_sub_genres_genre_id ON sub_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_sub_genres_name ON sub_genres(name);

-- Enable Row Level Security
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_genres ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admins can manage genres" ON genres
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage sub_genres" ON sub_genres
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_genres_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_genres_updated_at
  BEFORE UPDATE ON genres
  FOR EACH ROW
  EXECUTE FUNCTION update_genres_updated_at();

CREATE TRIGGER update_sub_genres_updated_at
  BEFORE UPDATE ON sub_genres
  FOR EACH ROW
  EXECUTE FUNCTION update_genres_updated_at();

-- === GENRE & SUBGENRE INSERTS ===

\i supabase/insert_additional_genres_and_subgenres.sql 