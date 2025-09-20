-- Create services table for admin management
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'studios', 'engineers', 'artists'
  name text NOT NULL,
  description text,
  contact text,
  website text,
  image text,
  image2 text,
  image3 text,
  subgenres text[],
  tier text,
  style_tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Optional: index for type
CREATE INDEX IF NOT EXISTS idx_services_type ON services(type); 