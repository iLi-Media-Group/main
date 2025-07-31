-- Database Restoration Script
-- This script will restore the essential tables that were lost

-- 1. Create profiles table (core table that other tables depend on)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'client' CHECK (account_type IN ('client', 'producer', 'admin', 'admin,producer')),
    first_name TEXT,
    last_name TEXT,
    business_name TEXT,
    business_structure TEXT,
    website TEXT,
    bio TEXT,
    profile_image_url TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_status TEXT DEFAULT 'inactive',
    subscription_plan TEXT,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    producer_status TEXT DEFAULT 'pending' CHECK (producer_status IN ('pending', 'approved', 'rejected')),
    producer_balance DECIMAL(10,2) DEFAULT 0.00,
    producer_payout_threshold DECIMAL(10,2) DEFAULT 50.00,
    producer_payout_email TEXT,
    producer_payout_method TEXT,
    producer_payout_schedule TEXT DEFAULT 'monthly',
    producer_payout_day INTEGER DEFAULT 1,
    producer_payout_month INTEGER DEFAULT 1,
    producer_payout_year INTEGER DEFAULT 2024,
    producer_payout_frequency TEXT DEFAULT 'monthly',
    producer_payout_last_date TIMESTAMP WITH TIME ZONE,
    producer_payout_next_date TIMESTAMP WITH TIME ZONE,
    producer_payout_total DECIMAL(10,2) DEFAULT 0.00,
    producer_payout_pending DECIMAL(10,2) DEFAULT 0.00,
    producer_payout_processed DECIMAL(10,2) DEFAULT 0.00,
    producer_payout_failed DECIMAL(10,2) DEFAULT 0.00,
    producer_payout_cancelled DECIMAL(10,2) DEFAULT 0.00,
    producer_payout_refunded DECIMAL(10,2) DEFAULT 0.00,
    producer_payout_disputed DECIMAL(10,2) DEFAULT 0.00,
    producer_payout_chargeback DECIMAL(10,2) DEFAULT 0.00,
    producer_payout_other DECIMAL(10,2) DEFAULT 0.00,
    producer_payout_total_count INTEGER DEFAULT 0,
    producer_payout_pending_count INTEGER DEFAULT 0,
    producer_payout_processed_count INTEGER DEFAULT 0,
    producer_payout_failed_count INTEGER DEFAULT 0,
    producer_payout_cancelled_count INTEGER DEFAULT 0,
    producer_payout_refunded_count INTEGER DEFAULT 0,
    producer_payout_disputed_count INTEGER DEFAULT 0,
    producer_payout_chargeback_count INTEGER DEFAULT 0,
    producer_payout_other_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Create producer_resources table
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

-- RLS Policies for producer_resources
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

-- 3. Create storage bucket for producer resources
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

-- 4. Create track-audio and track-images buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('track-audio', 'track-audio', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('track-images', 'track-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for track-audio bucket
CREATE POLICY IF NOT EXISTS "Producers can access track audio" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'track-audio' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'producer'
        )
    );

CREATE POLICY IF NOT EXISTS "Admins can access track audio" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'track-audio' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

CREATE POLICY IF NOT EXISTS "Hybrid admin/producer can access track audio" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'track-audio' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin,producer'
        )
    );

-- Storage policies for track-images bucket
CREATE POLICY IF NOT EXISTS "Producers can access track images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'track-images' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'producer'
        )
    );

CREATE POLICY IF NOT EXISTS "Admins can access track images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'track-images' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

CREATE POLICY IF NOT EXISTS "Hybrid admin/producer can access track images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'track-images' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin,producer'
        )
    );

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_producer_resources_updated_at BEFORE UPDATE ON producer_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Insert some sample data for testing
INSERT INTO producer_resources (title, description, category, external_url) VALUES
    ('Split Sheet Template', 'Standard split sheet template for producer collaborations', 'forms', 'https://example.com/split-sheet-template'),
    ('Producer Contract Template', 'Basic producer contract template', 'contracts', 'https://example.com/producer-contract'),
    ('Music Production Books', 'Recommended reading list for music producers', 'books', 'https://example.com/production-books'),
    ('Producer Website Guide', 'How to create a professional producer website', 'websites', 'https://example.com/website-guide')
ON CONFLICT DO NOTHING;

-- 8. Verify tables were created
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'producer_resources' as table_name, COUNT(*) as row_count FROM producer_resources; 