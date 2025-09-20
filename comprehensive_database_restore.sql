-- Comprehensive Database Restoration Script
-- This script will restore ALL tables from your migration files
-- Run this in your Supabase SQL Editor

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

-- 5. Create sync_proposals table
CREATE TABLE IF NOT EXISTS sync_proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    producer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'negotiating', 'completed', 'cancelled')),
    proposed_amount DECIMAL(10,2) NOT NULL,
    final_amount DECIMAL(10,2),
    negotiated_amount DECIMAL(10,2),
    payment_terms TEXT,
    counter_payment_terms TEXT,
    client_accepted_at TIMESTAMP WITH TIME ZONE,
    producer_accepted_at TIMESTAMP WITH TIME ZONE,
    media_usage TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create sync_proposal_messages table
CREATE TABLE IF NOT EXISTS sync_proposal_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id UUID REFERENCES sync_proposals(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create stripe_orders table
CREATE TABLE IF NOT EXISTS stripe_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_session_id TEXT UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create sales table
CREATE TABLE IF NOT EXISTS sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    commission_amount DECIMAL(10,2) DEFAULT 0.00,
    seller_amount DECIMAL(10,2) DEFAULT 0.00,
    stripe_payment_intent_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create white_label_clients table
CREATE TABLE IF NOT EXISTS white_label_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    business_name TEXT,
    domain TEXT,
    email TEXT,
    temp_password TEXT,
    color_primary TEXT DEFAULT '#3B82F6',
    color_secondary TEXT DEFAULT '#1E40AF',
    is_active BOOLEAN DEFAULT true,
    setup_fee_paid BOOLEAN DEFAULT false,
    monthly_fee_paid BOOLEAN DEFAULT false,
    setup_fee_amount DECIMAL(10,2) DEFAULT 0.00,
    monthly_fee_amount DECIMAL(10,2) DEFAULT 0.00,
    revenue_share_percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create white_label_features table
CREATE TABLE IF NOT EXISTS white_label_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, feature_name)
);

-- 11. Create producer_applications table
CREATE TABLE IF NOT EXISTS producer_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    business_name TEXT,
    website TEXT,
    bio TEXT,
    instruments TEXT[],
    experience_level TEXT,
    genres TEXT[],
    sample_tracks TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Create producer_invitations table
CREATE TABLE IF NOT EXISTS producer_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    invited_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Create services table
CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Create discounts table
CREATE TABLE IF NOT EXISTS discounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_amount DECIMAL(10,2) DEFAULT 0.00,
    maximum_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. Create media_types table
CREATE TABLE IF NOT EXISTS media_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. Create genres table
CREATE TABLE IF NOT EXISTS genres (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. Create sub_genres table
CREATE TABLE IF NOT EXISTS sub_genres (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    genre_id UUID REFERENCES genres(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(genre_id, name)
);

-- 21. Create service_onboarding_tokens table
CREATE TABLE IF NOT EXISTS service_onboarding_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 22. Create report_settings table
CREATE TABLE IF NOT EXISTS report_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    background_image_url TEXT,
    custom_logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 23. Create white_label_monthly_payments table
CREATE TABLE IF NOT EXISTS white_label_monthly_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES white_label_clients(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE producer_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_proposal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE producer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE producer_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_onboarding_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_monthly_payments ENABLE ROW LEVEL SECURITY;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contracts-and-forms', 'contracts-and-forms', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('track-audio', 'track-audio', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('track-images', 'track-images', false)
ON CONFLICT (id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at on all tables
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

DROP TRIGGER IF EXISTS update_sync_proposals_updated_at ON sync_proposals;
CREATE TRIGGER update_sync_proposals_updated_at BEFORE UPDATE ON sync_proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stripe_orders_updated_at ON stripe_orders;
CREATE TRIGGER update_stripe_orders_updated_at BEFORE UPDATE ON stripe_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_white_label_clients_updated_at ON white_label_clients;
CREATE TRIGGER update_white_label_clients_updated_at BEFORE UPDATE ON white_label_clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_white_label_features_updated_at ON white_label_features;
CREATE TRIGGER update_white_label_features_updated_at BEFORE UPDATE ON white_label_features
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_producer_applications_updated_at ON producer_applications;
CREATE TRIGGER update_producer_applications_updated_at BEFORE UPDATE ON producer_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_producer_invitations_updated_at ON producer_invitations;
CREATE TRIGGER update_producer_invitations_updated_at BEFORE UPDATE ON producer_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_messages_updated_at ON contact_messages;
CREATE TRIGGER update_contact_messages_updated_at BEFORE UPDATE ON contact_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_discounts_updated_at ON discounts;
CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON discounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_media_types_updated_at ON media_types;
CREATE TRIGGER update_media_types_updated_at BEFORE UPDATE ON media_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_genres_updated_at ON genres;
CREATE TRIGGER update_genres_updated_at BEFORE UPDATE ON genres
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sub_genres_updated_at ON sub_genres;
CREATE TRIGGER update_sub_genres_updated_at BEFORE UPDATE ON sub_genres
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_report_settings_updated_at ON report_settings;
CREATE TRIGGER update_report_settings_updated_at BEFORE UPDATE ON report_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_white_label_monthly_payments_updated_at ON white_label_monthly_payments;
CREATE TRIGGER update_white_label_monthly_payments_updated_at BEFORE UPDATE ON white_label_monthly_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO producer_resources (title, description, category, external_url) 
SELECT * FROM (VALUES
    ('Split Sheet Template', 'Standard split sheet template for producer collaborations', 'forms', 'https://example.com/split-sheet-template'),
    ('Producer Contract Template', 'Basic producer contract template', 'contracts', 'https://example.com/producer-contract'),
    ('Music Production Books', 'Recommended reading list for music producers', 'books', 'https://example.com/production-books'),
    ('Producer Website Guide', 'How to create a professional producer website', 'websites', 'https://example.com/website-guide')
) AS v(title, description, category, external_url)
WHERE NOT EXISTS (SELECT 1 FROM producer_resources LIMIT 1);

-- Verify all tables were created successfully
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'profiles' THEN (SELECT COUNT(*) FROM profiles)
        WHEN table_name = 'tracks' THEN (SELECT COUNT(*) FROM tracks)
        WHEN table_name = 'licenses' THEN (SELECT COUNT(*) FROM licenses)
        WHEN table_name = 'producer_resources' THEN (SELECT COUNT(*) FROM producer_resources)
        WHEN table_name = 'sync_proposals' THEN (SELECT COUNT(*) FROM sync_proposals)
        WHEN table_name = 'sync_proposal_messages' THEN (SELECT COUNT(*) FROM sync_proposal_messages)
        WHEN table_name = 'stripe_orders' THEN (SELECT COUNT(*) FROM stripe_orders)
        WHEN table_name = 'sales' THEN (SELECT COUNT(*) FROM sales)
        WHEN table_name = 'white_label_clients' THEN (SELECT COUNT(*) FROM white_label_clients)
        WHEN table_name = 'white_label_features' THEN (SELECT COUNT(*) FROM white_label_features)
        WHEN table_name = 'producer_applications' THEN (SELECT COUNT(*) FROM producer_applications)
        WHEN table_name = 'producer_invitations' THEN (SELECT COUNT(*) FROM producer_invitations)
        WHEN table_name = 'contact_messages' THEN (SELECT COUNT(*) FROM contact_messages)
        WHEN table_name = 'services' THEN (SELECT COUNT(*) FROM services)
        WHEN table_name = 'notifications' THEN (SELECT COUNT(*) FROM notifications)
        WHEN table_name = 'discounts' THEN (SELECT COUNT(*) FROM discounts)
        WHEN table_name = 'feature_flags' THEN (SELECT COUNT(*) FROM feature_flags)
        WHEN table_name = 'media_types' THEN (SELECT COUNT(*) FROM media_types)
        WHEN table_name = 'genres' THEN (SELECT COUNT(*) FROM genres)
        WHEN table_name = 'sub_genres' THEN (SELECT COUNT(*) FROM sub_genres)
        WHEN table_name = 'service_onboarding_tokens' THEN (SELECT COUNT(*) FROM service_onboarding_tokens)
        WHEN table_name = 'report_settings' THEN (SELECT COUNT(*) FROM report_settings)
        WHEN table_name = 'white_label_monthly_payments' THEN (SELECT COUNT(*) FROM white_label_monthly_payments)
        ELSE 0
    END as row_count
FROM (VALUES 
    ('profiles'),
    ('tracks'),
    ('licenses'),
    ('producer_resources'),
    ('sync_proposals'),
    ('sync_proposal_messages'),
    ('stripe_orders'),
    ('sales'),
    ('white_label_clients'),
    ('white_label_features'),
    ('producer_applications'),
    ('producer_invitations'),
    ('contact_messages'),
    ('services'),
    ('notifications'),
    ('discounts'),
    ('feature_flags'),
    ('media_types'),
    ('genres'),
    ('sub_genres'),
    ('service_onboarding_tokens'),
    ('report_settings'),
    ('white_label_monthly_payments')
) AS v(table_name); 