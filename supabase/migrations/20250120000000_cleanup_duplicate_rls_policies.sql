-- Clean up duplicate RLS policies and ensure all tables have proper RLS
-- This migration removes duplicate policies and consolidates RLS rules

-- ============================================
-- 1. CLEAN UP DUPLICATE POLICIES
-- ============================================

-- Remove duplicate policies for clients table
DROP POLICY IF EXISTS "Admin management of clients" ON clients;
DROP POLICY IF EXISTS "Allow admin to manage clients" ON clients;
DROP POLICY IF EXISTS "Allow public read access to clients" ON clients;
DROP POLICY IF EXISTS "Public read access to clients" ON clients;

-- Remove duplicate policies for genres table
DROP POLICY IF EXISTS "Admins and producers can read genres" ON genres;
DROP POLICY IF EXISTS "Admins can delete genres" ON genres;
DROP POLICY IF EXISTS "Admins can insert genres" ON genres;
DROP POLICY IF EXISTS "Admins can update genres" ON genres;

-- Remove duplicate policies for sub_genres table
DROP POLICY IF EXISTS "Admins and producers can read sub_genres" ON sub_genres;
DROP POLICY IF EXISTS "Admins can delete sub_genres" ON sub_genres;
DROP POLICY IF EXISTS "Admins can insert sub_genres" ON sub_genres;
DROP POLICY IF EXISTS "Admins can update sub_genres" ON sub_genres;

-- Remove duplicate policies for instrument_categories table
DROP POLICY IF EXISTS "Instrument categories are viewable by everyone" ON instrument_categories;

-- Remove duplicate policies for instruments table
DROP POLICY IF EXISTS "Instruments are viewable by everyone" ON instruments;

-- Remove duplicate policies for tracks table
DROP POLICY IF EXISTS "Producers can delete own tracks" ON tracks;
DROP POLICY IF EXISTS "Producers can insert own tracks" ON tracks;
DROP POLICY IF EXISTS "Producers can update own tracks" ON tracks;
DROP POLICY IF EXISTS "Tracks are viewable by everyone" ON tracks;

-- Remove duplicate policies for producer_applications table
DROP POLICY IF EXISTS "Admins and producers can update applications" ON producer_applications;
DROP POLICY IF EXISTS "Admins and producers can view all applications" ON producer_applications;
DROP POLICY IF EXISTS "Admins can delete" ON producer_applications;
DROP POLICY IF EXISTS "Admins can update" ON producer_applications;
DROP POLICY IF EXISTS "Allow inserts for anonymous users" ON producer_applications;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON producer_applications;
DROP POLICY IF EXISTS "Enable read access for admins" ON producer_applications;

-- Remove duplicate policies for site_settings table
DROP POLICY IF EXISTS "Allow admin to manage site_settings" ON site_settings;
DROP POLICY IF EXISTS "Everyone can read site settings" ON site_settings;
DROP POLICY IF EXISTS "Only admins can manage site settings" ON site_settings;

-- Remove duplicate policies for white_label_clients table
DROP POLICY IF EXISTS "Admin can access all white label clients" ON white_label_clients;
DROP POLICY IF EXISTS "Admins can delete white label clients" ON white_label_clients;
DROP POLICY IF EXISTS "Admins can insert white label clients" ON white_label_clients;
DROP POLICY IF EXISTS "Admins can manage all white label clients" ON white_label_clients;
DROP POLICY IF EXISTS "Admins can read all white label clients" ON white_label_clients;
DROP POLICY IF EXISTS "Admins can update white label clients" ON white_label_clients;
DROP POLICY IF EXISTS "Admins can view all white label clients" ON white_label_clients;
DROP POLICY IF EXISTS "White label client can update own branding" ON white_label_clients;
DROP POLICY IF EXISTS "White label client can view own branding" ON white_label_clients;
DROP POLICY IF EXISTS "White label clients can access their own data" ON white_label_clients;

-- Remove duplicate policies for white_label_features table
DROP POLICY IF EXISTS "Admins can manage all feature flags" ON white_label_features;
DROP POLICY IF EXISTS "White label clients can view their feature flags" ON white_label_features;

-- ============================================
-- 2. ENSURE ALL TABLES HAVE RLS ENABLED
-- ============================================

-- Enable RLS on tracks table if not already enabled
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other tables that might not have it enabled
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrument_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE producer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. VERIFY CLEANUP RESULTS
-- ============================================

-- Show final RLS status
SELECT 'Final RLS status after cleanup:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'information_schema%'
    AND tablename IN (
        'tracks', 'genres', 'sub_genres', 'instrument_categories', 
        'instruments', 'producer_applications', 'white_label_clients',
        'white_label_features', 'site_settings', 'clients'
    )
ORDER BY tablename;

-- Show remaining policies (should be clean now)
SELECT 'Remaining RLS policies after cleanup:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN (
        'tracks', 'genres', 'sub_genres', 'instrument_categories', 
        'instruments', 'producer_applications', 'white_label_clients',
        'white_label_features', 'site_settings', 'clients'
    )
ORDER BY tablename, policyname;
