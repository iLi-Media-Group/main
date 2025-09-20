-- Add Missing Columns First
-- This script adds the missing rights_holder_id columns to all tables before fixing RLS policies

-- ============================================
-- 1. CHECK WHICH TABLES NEED rights_holder_id COLUMN
-- ============================================

-- Check master_recordings table
SELECT 'master_recordings rights_holder_id check' as status,
       CASE
         WHEN EXISTS (
           SELECT FROM information_schema.columns 
           WHERE table_name = 'master_recordings' 
           AND column_name = 'rights_holder_id'
         )
         THEN 'rights_holder_id column exists'
         ELSE 'rights_holder_id column missing'
       END as result;

-- Check publishing_rights table
SELECT 'publishing_rights rights_holder_id check' as status,
       CASE
         WHEN EXISTS (
           SELECT FROM information_schema.columns 
           WHERE table_name = 'publishing_rights' 
           AND column_name = 'rights_holder_id'
         )
         THEN 'rights_holder_id column exists'
         ELSE 'rights_holder_id column missing'
       END as result;

-- Check split_sheets table
SELECT 'split_sheets rights_holder_id check' as status,
       CASE
         WHEN EXISTS (
           SELECT FROM information_schema.columns 
           WHERE table_name = 'split_sheets' 
           AND column_name = 'rights_holder_id'
         )
         THEN 'rights_holder_id column exists'
         ELSE 'rights_holder_id column missing'
       END as result;

-- ============================================
-- 2. ADD MISSING COLUMNS
-- ============================================

-- Add rights_holder_id to master_recordings if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'master_recordings' 
        AND column_name = 'rights_holder_id'
    ) THEN
        ALTER TABLE master_recordings ADD COLUMN rights_holder_id UUID REFERENCES rights_holders(id);
        RAISE NOTICE 'Added rights_holder_id column to master_recordings';
    ELSE
        RAISE NOTICE 'rights_holder_id column already exists in master_recordings';
    END IF;
END $$;

-- Add rights_holder_id to publishing_rights if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'publishing_rights' 
        AND column_name = 'rights_holder_id'
    ) THEN
        ALTER TABLE publishing_rights ADD COLUMN rights_holder_id UUID REFERENCES rights_holders(id);
        RAISE NOTICE 'Added rights_holder_id column to publishing_rights';
    ELSE
        RAISE NOTICE 'rights_holder_id column already exists in publishing_rights';
    END IF;
END $$;

-- Add rights_holder_id to split_sheets if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'split_sheets' 
        AND column_name = 'rights_holder_id'
    ) THEN
        ALTER TABLE split_sheets ADD COLUMN rights_holder_id UUID REFERENCES rights_holders(id);
        RAISE NOTICE 'Added rights_holder_id column to split_sheets';
    ELSE
        RAISE NOTICE 'rights_holder_id column already exists in split_sheets';
    END IF;
END $$;

-- ============================================
-- 3. VERIFY ALL COLUMNS ARE ADDED
-- ============================================

-- Final check for all tables
SELECT 'Final rights_holder_id check' as status,
       table_name,
       CASE
         WHEN EXISTS (
           SELECT FROM information_schema.columns 
           WHERE table_name = t.table_name 
           AND column_name = 'rights_holder_id'
         )
         THEN 'Column exists'
         ELSE 'Column missing'
       END as result
FROM (
    SELECT 'master_recordings' as table_name
    UNION SELECT 'publishing_rights'
    UNION SELECT 'split_sheets'
    UNION SELECT 'rights_holder_profiles'
) t
ORDER BY table_name;

-- ============================================
-- 4. SHOW TABLE SCHEMAS
-- ============================================

-- Show master_recordings schema
SELECT 'master_recordings schema' as table_name,
       column_name,
       data_type,
       is_nullable
FROM information_schema.columns
WHERE table_name = 'master_recordings'
ORDER BY ordinal_position;

-- Show publishing_rights schema
SELECT 'publishing_rights schema' as table_name,
       column_name,
       data_type,
       is_nullable
FROM information_schema.columns
WHERE table_name = 'publishing_rights'
ORDER BY ordinal_position;

-- Show split_sheets schema
SELECT 'split_sheets schema' as table_name,
       column_name,
       data_type,
       is_nullable
FROM information_schema.columns
WHERE table_name = 'split_sheets'
ORDER BY ordinal_position;

-- ============================================
-- 5. READY FOR RLS FIXES
-- ============================================

SELECT 'Ready for RLS fixes' as status,
       'All required columns are now present. You can now run the comprehensive_fix_all_issues.sql script.' as message,
       NOW() as timestamp;
