-- Analyze tables that need RLS policies
-- This helps us understand what each table does before adding policies

-- ============================================
-- 1. TABLES WITH RLS DISABLED (CRITICAL)
-- ============================================

-- active_licenses - Check structure and purpose
SELECT 'active_licenses table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'active_licenses'
ORDER BY ordinal_position;

-- Check if it's a view or table
SELECT 
    table_type,
    table_name
FROM information_schema.tables 
WHERE table_name = 'active_licenses';

-- membership_revenue - Check structure
SELECT 'membership_revenue table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'membership_revenue'
ORDER BY ordinal_position;

-- producer_invitations - Check structure
SELECT 'producer_invitations table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'producer_invitations'
ORDER BY ordinal_position;

-- ============================================
-- 2. TABLES WITH RLS ENABLED BUT NO POLICIES
-- ============================================

-- membership_history - Check structure
SELECT 'membership_history table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'membership_history'
ORDER BY ordinal_position;

-- memberships - Check structure
SELECT 'memberships table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'memberships'
ORDER BY ordinal_position;

-- producer_queue - Check structure
SELECT 'producer_queue table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'producer_queue'
ORDER BY ordinal_position;

-- service_onboarding_tokens - Check structure
SELECT 'service_onboarding_tokens table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'service_onboarding_tokens'
ORDER BY ordinal_position;

-- storage_buckets - Check structure
SELECT 'storage_buckets table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'storage_buckets'
ORDER BY ordinal_position;

-- subscriptions - Check structure
SELECT 'subscriptions table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- ============================================
-- 3. SAMPLE DATA ANALYSIS
-- ============================================

-- Check sample data to understand relationships
SELECT 'Sample active_licenses data:' as info;
SELECT * FROM active_licenses LIMIT 3;

SELECT 'Sample membership_revenue data:' as info;
SELECT * FROM membership_revenue LIMIT 3;

SELECT 'Sample producer_invitations data:' as info;
SELECT * FROM producer_invitations LIMIT 3;

SELECT 'Sample membership_history data:' as info;
SELECT * FROM membership_history LIMIT 3;

SELECT 'Sample memberships data:' as info;
SELECT * FROM memberships LIMIT 3;

SELECT 'Sample producer_queue data:' as info;
SELECT * FROM producer_queue LIMIT 3;

SELECT 'Sample service_onboarding_tokens data:' as info;
SELECT * FROM service_onboarding_tokens LIMIT 3;

SELECT 'Sample storage_buckets data:' as info;
SELECT * FROM storage_buckets LIMIT 3;

SELECT 'Sample subscriptions data:' as info;
SELECT * FROM subscriptions LIMIT 3;

-- ============================================
-- 4. FOREIGN KEY RELATIONSHIPS
-- ============================================

-- Check foreign key relationships for these tables
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN (
        'active_licenses',
        'membership_revenue', 
        'producer_invitations',
        'membership_history',
        'memberships',
        'producer_queue',
        'service_onboarding_tokens',
        'storage_buckets',
        'subscriptions'
    );
