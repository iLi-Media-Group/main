-- Safe migration for producer_resources table
-- This script only creates the table and storage bucket if they don't exist
-- It will NOT drop any existing data

-- 1. Create producer_resources table (only if it doesn't exist)
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

-- 2. Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_producer_resources_category ON producer_resources(category);
CREATE INDEX IF NOT EXISTS idx_producer_resources_created_at ON producer_resources(created_at DESC);

-- 3. Enable Row Level Security (only if not already enabled)
ALTER TABLE producer_resources ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies (only if they don't exist)
-- Producers can view all resources
CREATE POLICY IF NOT EXISTS "Producers can view resources" ON producer_resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'producer'
        )
    );

-- Admins can view all resources
CREATE POLICY IF NOT EXISTS "Admins can view resources" ON producer_resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

-- Hybrid admin/producer can view resources
CREATE POLICY IF NOT EXISTS "Hybrid admin/producer can view resources" ON producer_resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin,producer'
        )
    );

-- Admins can insert resources
CREATE POLICY IF NOT EXISTS "Admins can insert resources" ON producer_resources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

-- Admins can update resources
CREATE POLICY IF NOT EXISTS "Admins can update resources" ON producer_resources
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

-- Admins can delete resources
CREATE POLICY IF NOT EXISTS "Admins can delete resources" ON producer_resources
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

-- 5. Create storage bucket for producer resources (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contracts-and-forms', 'contracts-and-forms', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage policies for contracts-and-forms bucket (only if they don't exist)
CREATE POLICY IF NOT EXISTS "Producers can download resources" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'contracts-and-forms' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'producer'
        )
    );

CREATE POLICY IF NOT EXISTS "Admins can upload resources" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'contracts-and-forms' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

CREATE POLICY IF NOT EXISTS "Admins can update resources" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'contracts-and-forms' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

CREATE POLICY IF NOT EXISTS "Admins can delete resources" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'contracts-and-forms' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

-- 7. Create trigger for updated_at (only if it doesn't exist)
DROP TRIGGER IF EXISTS update_producer_resources_updated_at ON producer_resources;
CREATE TRIGGER update_producer_resources_updated_at BEFORE UPDATE ON producer_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Insert some default resources if the table is empty
INSERT INTO producer_resources (title, description, category, external_url)
VALUES 
    ('Sample Contract Template', 'A basic contract template for producer-client agreements', 'contracts', 'https://example.com/contract-template'),
    ('Music Production Guide', 'Essential tips and techniques for music production', 'books', 'https://example.com/production-guide'),
    ('Split Sheet Template', 'Standard split sheet for tracking songwriting credits', 'forms', 'https://example.com/split-sheet'),
    ('Website Building Resources', 'Tools and guides for building your producer website', 'websites', 'https://example.com/website-resources')
WHERE NOT EXISTS (SELECT 1 FROM producer_resources LIMIT 1);

-- 9. Verify the migration
SELECT 
    'producer_resources' as table_name,
    COUNT(*) as row_count
FROM producer_resources; 