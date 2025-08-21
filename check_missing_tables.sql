-- Check Missing Tables for Rights Holders System
-- This script identifies which tables are missing that the dashboard is trying to query

-- ============================================
-- 1. CHECK WHICH TABLES EXIST
-- ============================================

-- Check if master_recordings table exists
SELECT 'master_recordings table exists' as status WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'master_recordings'
);

-- Check if rights_licenses table exists
SELECT 'rights_licenses table exists' as status WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'rights_licenses'
);

-- Check if publishing_rights table exists
SELECT 'publishing_rights table exists' as status WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'publishing_rights'
);

-- Check if split_sheets table exists
SELECT 'split_sheets table exists' as status WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'split_sheets'
);

-- Check if split_sheet_participants table exists
SELECT 'split_sheet_participants table exists' as status WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'split_sheet_participants'
);

-- Check if rights_agreements table exists
SELECT 'rights_agreements table exists' as status WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'rights_agreements'
);

-- Check if rights_verifications table exists
SELECT 'rights_verifications table exists' as status WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'rights_verifications'
);

-- Check if co_signers table exists
SELECT 'co_signers table exists' as status WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'co_signers'
);

-- ============================================
-- 2. LIST ALL TABLES IN THE SYSTEM
-- ============================================

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%rights%' OR table_name LIKE '%master%' OR table_name LIKE '%split%' OR table_name LIKE '%co_%'
ORDER BY table_name;
