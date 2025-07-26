-- Update producer_applications table to restructure instruments and add new fields
-- This migration replaces the single 'instruments' column with individual instrument columns
-- and adds new fields for recording artists

-- First, add the new columns
ALTER TABLE public.producer_applications 
ADD COLUMN IF NOT EXISTS instrument_one text,
ADD COLUMN IF NOT EXISTS instrument_one_proficiency text CHECK (instrument_one_proficiency IN ('beginner', 'intermediate', 'pro')),
ADD COLUMN IF NOT EXISTS instrument_two text,
ADD COLUMN IF NOT EXISTS instrument_two_proficiency text CHECK (instrument_two_proficiency IN ('beginner', 'intermediate', 'pro')),
ADD COLUMN IF NOT EXISTS instrument_three text,
ADD COLUMN IF NOT EXISTS instrument_three_proficiency text CHECK (instrument_three_proficiency IN ('beginner', 'intermediate', 'pro')),
ADD COLUMN IF NOT EXISTS instrument_four text,
ADD COLUMN IF NOT EXISTS instrument_four_proficiency text CHECK (instrument_four_proficiency IN ('beginner', 'intermediate', 'pro')),
ADD COLUMN IF NOT EXISTS records_artists text CHECK (records_artists IN ('Yes', 'No')),
ADD COLUMN IF NOT EXISTS artist_example_link text;

-- Add comments for documentation
COMMENT ON COLUMN public.producer_applications.instrument_one IS 'First instrument the producer plays';
COMMENT ON COLUMN public.producer_applications.instrument_one_proficiency IS 'Proficiency level for first instrument: beginner, intermediate, pro';
COMMENT ON COLUMN public.producer_applications.instrument_two IS 'Second instrument the producer plays';
COMMENT ON COLUMN public.producer_applications.instrument_two_proficiency IS 'Proficiency level for second instrument: beginner, intermediate, pro';
COMMENT ON COLUMN public.producer_applications.instrument_three IS 'Third instrument the producer plays';
COMMENT ON COLUMN public.producer_applications.instrument_three_proficiency IS 'Proficiency level for third instrument: beginner, intermediate, pro';
COMMENT ON COLUMN public.producer_applications.instrument_four IS 'Fourth instrument the producer plays';
COMMENT ON COLUMN public.producer_applications.instrument_four_proficiency IS 'Proficiency level for fourth instrument: beginner, intermediate, pro';
COMMENT ON COLUMN public.producer_applications.records_artists IS 'Whether the producer records artists: Yes or No';
COMMENT ON COLUMN public.producer_applications.artist_example_link IS 'Example link to an artist the producer works with';

-- Note: We'll keep the existing 'instruments' column for backward compatibility
-- but it will be deprecated in favor of the new individual instrument columns 