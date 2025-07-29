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
CREATE POLICY "Producers can view resources" ON producer_resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'producer'
        )
    );

-- Admins can view all resources
CREATE POLICY "Admins can view resources" ON producer_resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

-- Admins can insert resources
CREATE POLICY "Admins can insert resources" ON producer_resources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

-- Admins can update resources
CREATE POLICY "Admins can update resources" ON producer_resources
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

-- Admins can delete resources
CREATE POLICY "Admins can delete resources" ON producer_resources
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
CREATE POLICY "Producers can download resources" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'contracts-and-forms' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'producer'
        )
    );

CREATE POLICY "Admins can upload resources" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'contracts-and-forms' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

CREATE POLICY "Admins can update resources" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'contracts-and-forms' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

CREATE POLICY "Admins can delete resources" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'contracts-and-forms' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

-- Insert some sample resources
INSERT INTO producer_resources (title, description, category, external_url) VALUES
(
    'Split Sheet Template',
    'Professional split sheet template for tracking songwriting and production credits. Use this template to document all contributors and their percentages for each track.',
    'forms',
    'https://docs.google.com/spreadsheets/d/example'
),
(
    'Music Licensing Contract Template',
    'Standard music licensing agreement template. This contract covers sync licensing, master use rights, and publishing splits.',
    'contracts',
    'https://docs.google.com/document/d/example'
),
(
    'Producer Website Guide',
    'Complete guide to building a professional producer website. Includes tips on portfolio design, SEO, and client acquisition.',
    'websites',
    'https://example.com/producer-website-guide'
),
(
    'The Music Business: A Legal Guide',
    'Essential reading for understanding music industry law, contracts, and business practices.',
    'books',
    'https://amazon.com/music-business-legal-guide'
),
(
    'Invoice Template',
    'Professional invoice template for music producers. Includes all necessary fields for tracking payments and expenses.',
    'forms',
    'https://docs.google.com/spreadsheets/d/invoice-template'
),
(
    'Sync Licensing 101',
    'Comprehensive guide to sync licensing, including how to pitch to music supervisors and negotiate fair rates.',
    'contracts',
    'https://example.com/sync-licensing-guide'
),
(
    'Social Media Strategy for Producers',
    'Learn how to build your brand and attract clients through strategic social media marketing.',
    'websites',
    'https://example.com/social-media-strategy'
),
(
    'All You Need to Know About the Music Business',
    'Classic book covering all aspects of the music industry, from contracts to copyright law.',
    'books',
    'https://amazon.com/all-you-need-know-music-business'
); 