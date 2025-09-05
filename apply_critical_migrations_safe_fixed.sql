-- Critical Safe Migrations for Restored Database (FIXED)
-- This script applies the most important recent migrations safely
-- It will NOT drop any existing data or tables

-- ============================================
-- 1. PRODUCER RESOURCES TABLE
-- ============================================

-- Create producer_resources table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS producer_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('contracts', 'websites', 'books', 'forms')),
    file_url TEXT,
    external_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_producer_resources_category ON producer_resources(category);
CREATE INDEX IF NOT EXISTS idx_producer_resources_created_at ON producer_resources(created_at DESC);

-- Enable Row Level Security (only if not already enabled)
ALTER TABLE producer_resources ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (drop first if they exist, then create)
-- Producers can view all resources
DROP POLICY IF EXISTS "Producers can view resources" ON producer_resources;
CREATE POLICY "Producers can view resources" ON producer_resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'producer'
        )
    );

-- Admins can view all resources
DROP POLICY IF EXISTS "Admins can view resources" ON producer_resources;
CREATE POLICY "Admins can view resources" ON producer_resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

-- Hybrid admin/producer can view resources
DROP POLICY IF EXISTS "Hybrid admin/producer can view resources" ON producer_resources;
CREATE POLICY "Hybrid admin/producer can view resources" ON producer_resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin,producer'
        )
    );

-- Admins can insert resources
DROP POLICY IF EXISTS "Admins can insert resources" ON producer_resources;
CREATE POLICY "Admins can insert resources" ON producer_resources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

-- Admins can update resources
DROP POLICY IF EXISTS "Admins can update resources" ON producer_resources;
CREATE POLICY "Admins can update resources" ON producer_resources
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

-- Admins can delete resources
DROP POLICY IF EXISTS "Admins can delete resources" ON producer_resources;
CREATE POLICY "Admins can delete resources" ON producer_resources
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

-- Create storage bucket for producer resources (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contracts-and-forms', 'contracts-and-forms', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for contracts-and-forms bucket (drop first if they exist, then create)
DROP POLICY IF EXISTS "Producers can download resources" ON storage.objects;
CREATE POLICY "Producers can download resources" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'contracts-and-forms' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'producer'
        )
    );

DROP POLICY IF EXISTS "Admins can upload resources" ON storage.objects;
CREATE POLICY "Admins can upload resources" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'contracts-and-forms' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update resources" ON storage.objects;
CREATE POLICY "Admins can update resources" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'contracts-and-forms' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can delete resources" ON storage.objects;
CREATE POLICY "Admins can delete resources" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'contracts-and-forms' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

-- Create trigger for updated_at (only if it doesn't exist)
DROP TRIGGER IF EXISTS update_producer_resources_updated_at ON producer_resources;
CREATE TRIGGER update_producer_resources_updated_at BEFORE UPDATE ON producer_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. ACCOUNT TYPE CONSTRAINT FIX
-- ============================================

-- Drop all possible account_type related constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_account_type;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check_old;

-- Add a new comprehensive constraint that supports dual roles
ALTER TABLE profiles ADD CONSTRAINT profiles_account_type_check 
CHECK (
  account_type IN (
    'client', 
    'producer', 
    'admin', 
    'white_label',
    'admin,producer'  -- Dual role for main admin
  )
);

-- ============================================
-- 3. PRODUCER ONBOARDING FEATURE FLAG
-- ============================================

-- Create white_label_features table if it doesn't exist
CREATE TABLE IF NOT EXISTS white_label_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES white_label_clients(id),
    feature_name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, feature_name)
);

-- Enable producer_onboarding feature flag globally
UPDATE white_label_features 
SET is_enabled = true 
WHERE client_id IS NULL 
AND feature_name = 'producer_onboarding';

-- If the record doesn't exist, insert it
INSERT INTO white_label_features (client_id, feature_name, is_enabled)
VALUES (NULL, 'producer_onboarding', true)
ON CONFLICT (client_id, feature_name) 
DO UPDATE SET is_enabled = true;

-- ============================================
-- 4. PRODUCER APPLICATIONS INSTRUMENTS
-- ============================================

-- Add instruments column to producer_applications if it doesn't exist
ALTER TABLE producer_applications ADD COLUMN IF NOT EXISTS instruments TEXT[];

-- ============================================
-- 5. INSERT DEFAULT RESOURCES (FIXED)
-- ============================================

-- Insert some default resources only if the table is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM producer_resources LIMIT 1) THEN
        INSERT INTO producer_resources (title, description, category, external_url)
        VALUES 
            ('Sample Contract Template', 'A basic contract template for producer-client agreements', 'contracts', 'https://example.com/contract-template'),
            ('Music Production Guide', 'Essential tips and techniques for music production', 'books', 'https://example.com/production-guide'),
            ('Split Sheet Template', 'Standard split sheet for tracking songwriting credits', 'forms', 'https://example.com/split-sheet'),
            ('Website Building Resources', 'Tools and guides for building your producer website', 'websites', 'https://example.com/website-resources');
    END IF;
END $$;

-- ============================================
-- 6. VERIFICATION
-- ============================================

-- Verify the migrations
SELECT 
    'producer_resources' as table_name,
    COUNT(*) as row_count
FROM producer_resources;

SELECT 
    'white_label_features' as table_name,
    COUNT(*) as row_count
FROM white_label_features;

SELECT 
    'profiles with admin,producer' as description,
    COUNT(*) as count
FROM profiles 
WHERE account_type = 'admin,producer'; 