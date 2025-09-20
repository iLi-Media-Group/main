-- Fix Hip-Hop Search Variations and Add Membership Revenue Tracking
-- This script addresses both the search synonyms table error and membership revenue inclusion

-- ============================================
-- 1. FIX SEARCH SYNONYMS TABLE
-- ============================================

-- First, let's check the current structure of search_synonyms table
SELECT 'Current search_synonyms table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'search_synonyms'
ORDER BY ordinal_position;

-- Check what data currently exists in the table
SELECT 'Current search_synonyms data:' as info;
SELECT * FROM search_synonyms LIMIT 5;

-- Update existing hip-hop related synonyms with comprehensive variations
-- Use the correct column name (likely 'term' instead of 'search_term')
UPDATE search_synonyms 
SET synonyms = ARRAY[
  'hiphop', 'hip hop', 'hip-hop', 'rap', 'trap', 'drill', 'grime', 
  'hip hop music', 'hip-hop music', 'hiphop music', 'hip hop rap',
  'hip-hop rap', 'hiphop rap', 'rap music', 'trap music', 'drill music',
  'urban', 'street', 'gangsta', 'conscious', 'underground', 'mainstream'
]
WHERE term IN ('hiphop', 'hip hop', 'hip-hop');

-- Insert additional variations if they don't exist
INSERT INTO search_synonyms (term, synonyms)
VALUES 
  ('rap', ARRAY['hiphop', 'hip hop', 'hip-hop', 'trap', 'drill', 'grime', 'rap music', 'urban']),
  ('trap', ARRAY['hiphop', 'hip hop', 'hip-hop', 'rap', 'drill', 'trap music', 'urban']),
  ('drill', ARRAY['hiphop', 'hip hop', 'hip-hop', 'rap', 'trap', 'drill music', 'urban'])
ON CONFLICT (term) DO UPDATE SET
  synonyms = EXCLUDED.synonyms;

-- ============================================
-- 2. CREATE MEMBERSHIP REVENUE TRACKING TABLES
-- ============================================

-- Create membership_revenue table to track monthly membership revenue
CREATE TABLE IF NOT EXISTS membership_revenue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT NOT NULL UNIQUE, -- Format: YYYY-MM
  total_revenue NUMERIC(10,2) DEFAULT 0,
  gold_subscriptions INTEGER DEFAULT 0,
  platinum_subscriptions INTEGER DEFAULT 0,
  ultimate_subscriptions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create active_licenses table to track producer license activity
CREATE TABLE IF NOT EXISTS active_licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT NOT NULL, -- Format: YYYY-MM
  producer_id UUID REFERENCES profiles(id),
  license_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(month, producer_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_membership_revenue_month ON membership_revenue(month);
CREATE INDEX IF NOT EXISTS idx_active_licenses_month ON active_licenses(month);
CREATE INDEX IF NOT EXISTS idx_active_licenses_producer ON active_licenses(producer_id);

-- ============================================
-- 3. CREATE FUNCTIONS FOR MEMBERSHIP REVENUE CALCULATION
-- ============================================

-- Function to calculate and store monthly membership revenue
CREATE OR REPLACE FUNCTION calculate_monthly_membership_revenue(month_input TEXT)
RETURNS VOID AS $$
DECLARE
  month_start DATE := (month_input || '-01')::DATE;
  month_end DATE := (month_start + INTERVAL '1 month')::DATE;
  gold_count INTEGER := 0;
  platinum_count INTEGER := 0;
  ultimate_count INTEGER := 0;
  total_revenue NUMERIC(10,2) := 0;
BEGIN
  -- Count active subscriptions by type for the month
  SELECT COUNT(*) INTO gold_count
  FROM stripe_subscriptions
  WHERE status = 'active'
    AND price_id = 'price_1RdAfER8RYA8TFzw7RrrNmtt' -- Gold Access
    AND created_at >= month_start
    AND created_at < month_end;

  SELECT COUNT(*) INTO platinum_count
  FROM stripe_subscriptions
  WHERE status = 'active'
    AND price_id = 'price_1RdAfXR8RYA8TFzwFZyaSREP' -- Platinum Access
    AND created_at >= month_start
    AND created_at < month_end;

  SELECT COUNT(*) INTO ultimate_count
  FROM stripe_subscriptions
  WHERE status = 'active'
    AND price_id = 'price_1RdAfqR8RYA8TFzwKP7zrKsm' -- Ultimate Access
    AND created_at >= month_start
    AND created_at < month_end;

  -- Calculate total revenue
  total_revenue := (gold_count * 99) + (platinum_count * 199) + (ultimate_count * 299);

  -- Insert or update membership revenue record
  INSERT INTO membership_revenue (month, total_revenue, gold_subscriptions, platinum_subscriptions, ultimate_subscriptions)
  VALUES (month_input, total_revenue, gold_count, platinum_count, ultimate_count)
  ON CONFLICT (month) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    gold_subscriptions = EXCLUDED.gold_subscriptions,
    platinum_subscriptions = EXCLUDED.platinum_subscriptions,
    ultimate_subscriptions = EXCLUDED.ultimate_subscriptions,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to calculate and store active licenses per producer
CREATE OR REPLACE FUNCTION calculate_active_licenses(month_input TEXT)
RETURNS VOID AS $$
DECLARE
  month_start DATE := (month_input || '-01')::DATE;
  month_end DATE := (month_start + INTERVAL '1 month')::DATE;
BEGIN
  -- Clear existing records for the month
  DELETE FROM active_licenses WHERE month = month_input;

  -- Insert active licenses for the month
  INSERT INTO active_licenses (month, producer_id, license_count)
  SELECT 
    month_input,
    t.track_producer_id,
    COUNT(DISTINCT s.id) as license_count
  FROM tracks t
  JOIN sales s ON t.id = s.track_id
  WHERE s.created_at >= month_start
    AND s.created_at < month_end
    AND t.track_producer_id IS NOT NULL
  GROUP BY t.track_producer_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get producer's membership bucket percentage
CREATE OR REPLACE FUNCTION get_producer_bucket_percentage(
  producer_id_input UUID,
  month_input TEXT DEFAULT to_char(CURRENT_DATE, 'YYYY-MM')
)
RETURNS TABLE (
  producer_id UUID,
  producer_name TEXT,
  total_licenses INTEGER,
  total_producer_licenses INTEGER,
  bucket_percentage NUMERIC(5,2),
  estimated_bucket_earnings NUMERIC(10,2)
) AS $$
DECLARE
  total_licenses_count INTEGER := 0;
  producer_licenses_count INTEGER := 0;
  membership_revenue_amount NUMERIC(10,2) := 0;
BEGIN
  -- Get total licenses for the month
  SELECT COALESCE(SUM(al.license_count), 0) INTO total_licenses_count
  FROM active_licenses al
  WHERE al.month = month_input;

  -- Get producer's licenses for the month
  SELECT COALESCE(al.license_count, 0) INTO producer_licenses_count
  FROM active_licenses al
  WHERE al.month = month_input AND al.producer_id = producer_id_input;

  -- Get membership revenue for the month
  SELECT COALESCE(mr.total_revenue, 0) INTO membership_revenue_amount
  FROM membership_revenue mr
  WHERE mr.month = month_input;

  -- Return results
  RETURN QUERY
  SELECT 
    p.id as producer_id,
    CONCAT(p.first_name, ' ', p.last_name) as producer_name,
    total_licenses_count as total_licenses,
    producer_licenses_count as total_producer_licenses,
    CASE 
      WHEN total_licenses_count > 0 THEN 
        ROUND((producer_licenses_count::NUMERIC / total_licenses_count) * 100, 2)
      ELSE 0 
    END as bucket_percentage,
    CASE 
      WHEN total_licenses_count > 0 THEN 
        (producer_licenses_count::NUMERIC / total_licenses_count) * (membership_revenue_amount * 0.45)
      ELSE 0 
    END as estimated_bucket_earnings
  FROM profiles p
  WHERE p.id = producer_id_input;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. POPULATE INITIAL DATA
-- ============================================

-- Calculate membership revenue for current month
SELECT calculate_monthly_membership_revenue(to_char(CURRENT_DATE, 'YYYY-MM'));

-- Calculate active licenses for current month
SELECT calculate_active_licenses(to_char(CURRENT_DATE, 'YYYY-MM'));

-- ============================================
-- 5. TEST THE FUNCTIONS
-- ============================================

-- Test the search synonyms
SELECT 'Testing hip-hop variations:' as test_info;
SELECT term, synonyms FROM search_synonyms WHERE term IN ('hiphop', 'hip hop', 'hip-hop', 'rap', 'trap', 'drill');

-- Test membership revenue calculation
SELECT 'Current month membership revenue:' as test_info;
SELECT * FROM membership_revenue WHERE month = to_char(CURRENT_DATE, 'YYYY-MM');

-- Test active licenses
SELECT 'Current month active licenses:' as test_info;
SELECT 
  al.month,
  p.email,
  al.license_count
FROM active_licenses al
JOIN profiles p ON al.producer_id = p.id
WHERE al.month = to_char(CURRENT_DATE, 'YYYY-MM')
ORDER BY al.license_count DESC;

-- Test producer bucket percentage (replace with actual producer ID)
SELECT 'Producer bucket percentage example:' as test_info;
SELECT * FROM get_producer_bucket_percentage(
  (SELECT id FROM profiles WHERE account_type LIKE '%producer%' LIMIT 1),
  to_char(CURRENT_DATE, 'YYYY-MM')
);

-- ============================================
-- 6. SUMMARY
-- ============================================

SELECT 'Summary of changes:' as info;
SELECT 
  'Search synonyms updated for hip-hop variations' as change,
  'Membership revenue tracking tables created' as status
UNION ALL
SELECT 
  'Functions created for membership calculations' as change,
  'Producer bucket percentage calculation available' as status
UNION ALL
SELECT 
  'Initial data populated' as change,
  'Ready for integration with frontend' as status;
