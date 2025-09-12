-- Complete Database Restoration Script
-- This script will restore all essential tables in the correct order
-- It avoids problematic views and constraints that caused previous failures

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
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Create tracks table
CREATE TABLE IF NOT EXISTS tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    genre TEXT,
    bpm INTEGER,
    key TEXT,
    duration INTEGER,
    audio_url TEXT,
    image_url TEXT,
    stems_url TEXT,
    split_sheet_url TEXT,
    price DECIMAL(10,2) DEFAULT 0.00,
    is_sync_only BOOLEAN DEFAULT false,
    is_ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tracks
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tracks
DROP POLICY IF EXISTS "Producers can view own tracks" ON tracks;
CREATE POLICY "Producers can view own tracks" ON tracks
    FOR SELECT USING (producer_id = auth.uid());

DROP POLICY IF EXISTS "Producers can insert own tracks" ON tracks;
CREATE POLICY "Producers can insert own tracks" ON tracks
    FOR INSERT WITH CHECK (producer_id = auth.uid());

DROP POLICY IF EXISTS "Producers can update own tracks" ON tracks;
CREATE POLICY "Producers can update own tracks" ON tracks
    FOR UPDATE USING (producer_id = auth.uid());

DROP POLICY IF EXISTS "Producers can delete own tracks" ON tracks;
CREATE POLICY "Producers can delete own tracks" ON tracks
    FOR DELETE USING (producer_id = auth.uid());

-- 3. Create licenses table
CREATE TABLE IF NOT EXISTS licenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    license_type TEXT NOT NULL CHECK (license_type IN ('basic', 'premium', 'exclusive')),
    license_status TEXT NOT NULL DEFAULT 'active' CHECK (license_status IN ('active', 'expired', 'cancelled')),
    license_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    license_end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on licenses
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for licenses
DROP POLICY IF EXISTS "Clients can view own licenses" ON licenses;
CREATE POLICY "Clients can view own licenses" ON licenses
    FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Producers can view licenses for their tracks" ON licenses;
CREATE POLICY "Producers can view licenses for their tracks" ON licenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tracks 
            WHERE tracks.id = licenses.track_id 
            AND tracks.producer_id = auth.uid()
        )
    );

-- 4. Create producer_resources table
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

-- Hybrid admin/producer can view all resources
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

-- 5. Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contracts-and-forms', 'contracts-and-forms', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('track-audio', 'track-audio', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('track-images', 'track-images', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Create storage policies for contracts-and-forms bucket
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

DROP POLICY IF EXISTS "Admins can download resources" ON storage.objects;
CREATE POLICY "Admins can download resources" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'contracts-and-forms' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

DROP POLICY IF EXISTS "Hybrid admin/producer can download resources" ON storage.objects;
CREATE POLICY "Hybrid admin/producer can download resources" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'contracts-and-forms' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin,producer'
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

-- 7. Create storage policies for track-audio bucket
DROP POLICY IF EXISTS "Producers can access track audio" ON storage.objects;
CREATE POLICY "Producers can access track audio" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'track-audio' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'producer'
        )
    );

DROP POLICY IF EXISTS "Admins can access track audio" ON storage.objects;
CREATE POLICY "Admins can access track audio" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'track-audio' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

DROP POLICY IF EXISTS "Hybrid admin/producer can access track audio" ON storage.objects;
CREATE POLICY "Hybrid admin/producer can access track audio" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'track-audio' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin,producer'
        )
    );

-- 8. Create storage policies for track-images bucket
DROP POLICY IF EXISTS "Producers can access track images" ON storage.objects;
CREATE POLICY "Producers can access track images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'track-images' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'producer'
        )
    );

DROP POLICY IF EXISTS "Admins can access track images" ON storage.objects;
CREATE POLICY "Admins can access track images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'track-images' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
        )
    );

DROP POLICY IF EXISTS "Hybrid admin/producer can access track images" ON storage.objects;
CREATE POLICY "Hybrid admin/producer can access track images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'track-images' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin,producer'
        )
    );

-- 9. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tracks_updated_at ON tracks;
CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON tracks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_licenses_updated_at ON licenses;
CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_producer_resources_updated_at ON producer_resources;
CREATE TRIGGER update_producer_resources_updated_at BEFORE UPDATE ON producer_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Insert sample data for testing
INSERT INTO producer_resources (title, description, category, external_url) 
SELECT * FROM (VALUES
    ('Split Sheet Template', 'Standard split sheet template for producer collaborations', 'forms', 'https://example.com/split-sheet-template'),
    ('Producer Contract Template', 'Basic producer contract template', 'contracts', 'https://example.com/producer-contract'),
    ('Music Production Books', 'Recommended reading list for music producers', 'books', 'https://example.com/production-books'),
    ('Producer Website Guide', 'How to create a professional producer website', 'websites', 'https://example.com/website-guide')
) AS v(title, description, category, external_url)
WHERE NOT EXISTS (SELECT 1 FROM producer_resources LIMIT 1);

-- 12. Verify all tables were created successfully
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'profiles' THEN (SELECT COUNT(*) FROM profiles)
        WHEN table_name = 'tracks' THEN (SELECT COUNT(*) FROM tracks)
        WHEN table_name = 'licenses' THEN (SELECT COUNT(*) FROM licenses)
        WHEN table_name = 'producer_resources' THEN (SELECT COUNT(*) FROM producer_resources)
        ELSE 0
    END as row_count
FROM (VALUES 
    ('profiles'),
    ('tracks'),
    ('licenses'),
    ('producer_resources')
) AS v(table_name); 