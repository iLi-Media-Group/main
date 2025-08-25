-- Fix instruments table structure
-- Run this in your Supabase SQL Editor

-- First, let's check what we have
SELECT 'Current instruments table structure:' as info;
\d instruments;

-- Check if sub_instruments table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'sub_instruments'
) as sub_instruments_exists;

-- Create sub_instruments table if it doesn't exist
CREATE TABLE IF NOT EXISTS sub_instruments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(instrument_id, name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sub_instruments_instrument_id ON sub_instruments(instrument_id);
CREATE INDEX IF NOT EXISTS idx_sub_instruments_name ON sub_instruments(name);

-- Enable Row Level Security on sub_instruments if not already enabled
ALTER TABLE sub_instruments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sub_instruments table (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sub_instruments' 
    AND policyname = 'Sub instruments are viewable by everyone'
  ) THEN
    CREATE POLICY "Sub instruments are viewable by everyone" ON sub_instruments
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sub_instruments' 
    AND policyname = 'Sub instruments are insertable by admins'
  ) THEN
    CREATE POLICY "Sub instruments are insertable by admins" ON sub_instruments
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.account_type = 'admin'
        )
      );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sub_instruments' 
    AND policyname = 'Sub instruments are updatable by admins'
  ) THEN
    CREATE POLICY "Sub instruments are updatable by admins" ON sub_instruments
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.account_type = 'admin'
        )
      );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sub_instruments' 
    AND policyname = 'Sub instruments are deletable by admins'
  ) THEN
    CREATE POLICY "Sub instruments are deletable by admins" ON sub_instruments
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.account_type = 'admin'
        )
      );
  END IF;
END $$;

-- Show current instruments
SELECT 'Current instruments:' as info;
SELECT * FROM instruments;

-- Show current sub_instruments (if any)
SELECT 'Current sub_instruments:' as info;
SELECT * FROM sub_instruments;
