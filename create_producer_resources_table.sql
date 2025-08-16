-- Create producer_resources table
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_producer_resources_category ON producer_resources(category);
CREATE INDEX IF NOT EXISTS idx_producer_resources_created_at ON producer_resources(created_at DESC);

-- Enable Row Level Security
ALTER TABLE producer_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Create storage bucket for producer resources
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contracts-and-forms', 'contracts-and-forms', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for contracts-and-forms bucket
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