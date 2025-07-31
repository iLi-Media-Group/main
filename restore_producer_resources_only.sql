-- Minimal Database Restoration Script
-- This script only creates the missing producer_resources table and storage bucket
-- It does NOT affect any existing data or tables

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

-- Create index for better performance (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_producer_resources_category ON producer_resources(category);
CREATE INDEX IF NOT EXISTS idx_producer_resources_created_at ON producer_resources(created_at DESC);

-- Enable Row Level Security (only if not already enabled)
ALTER TABLE producer_resources ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS Policies for producer_resources (only if they don't exist)
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

-- Hybrid admin/producer can view all resources
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

-- 3. Create storage bucket for producer resources (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contracts-and-forms', 'contracts-and-forms', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Create storage policies for contracts-and-forms bucket (only if they don't exist)
CREATE POLICY IF NOT EXISTS "Producers can download resources" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'contracts-and-forms' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'producer'
        )
    );

CREATE POLICY IF NOT EXISTS "Admins can download resources" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'contracts-and-forms' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

CREATE POLICY IF NOT EXISTS "Hybrid admin/producer can download resources" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'contracts-and-forms' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin,producer'
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

-- 5. Create function to update updated_at timestamp (only if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create trigger for updated_at (only if it doesn't exist)
DROP TRIGGER IF EXISTS update_producer_resources_updated_at ON producer_resources;
CREATE TRIGGER update_producer_resources_updated_at BEFORE UPDATE ON producer_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Insert some sample data for testing (only if table is empty)
INSERT INTO producer_resources (title, description, category, external_url) 
SELECT * FROM (VALUES
    ('Split Sheet Template', 'Standard split sheet template for producer collaborations', 'forms', 'https://example.com/split-sheet-template'),
    ('Producer Contract Template', 'Basic producer contract template', 'contracts', 'https://example.com/producer-contract'),
    ('Music Production Books', 'Recommended reading list for music producers', 'books', 'https://example.com/production-books'),
    ('Producer Website Guide', 'How to create a professional producer website', 'websites', 'https://example.com/website-guide')
) AS v(title, description, category, external_url)
WHERE NOT EXISTS (SELECT 1 FROM producer_resources LIMIT 1);

-- 8. Verify the table was created successfully
SELECT 
    'producer_resources' as table_name, 
    COUNT(*) as row_count,
    CASE WHEN COUNT(*) > 0 THEN 'SUCCESS: Table exists with data' ELSE 'SUCCESS: Table exists but empty' END as status
FROM producer_resources; 