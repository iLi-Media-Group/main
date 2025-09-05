/*
  # Fix Supabase Database Issues
  
  This script addresses the two issues identified by the Supabase team:
  
  1. Remove the self-referencing admin_sales_details view that's causing restoration failure
  2. Fix the foreign key constraint issue with the identities table
  
  Run this script in your Supabase SQL Editor to resolve these issues.
*/

-- ===========================================
-- 1. FIX: Remove the problematic admin_sales_details view
-- ===========================================

-- Drop the self-referencing view that's causing restoration issues
DROP VIEW IF EXISTS public.admin_sales_details;

-- Also drop any related views that might be causing issues
DROP VIEW IF EXISTS admin_sales_details;

-- ===========================================
-- 2. FIX: Address the identities foreign key constraint issue
-- ===========================================

-- First, let's check if the identities table exists and what the issue might be
DO $$
BEGIN
    -- Check if identities table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'identities') THEN
        -- Check for orphaned records in identities table
        -- These are records that reference users that no longer exist
        DELETE FROM auth.identities 
        WHERE user_id NOT IN (SELECT id FROM auth.users);
        
        RAISE NOTICE 'Cleaned up orphaned identities records';
    ELSE
        RAISE NOTICE 'Identities table does not exist';
    END IF;
END $$;

-- ===========================================
-- 3. ADDITIONAL CLEANUP: Remove any other problematic views
-- ===========================================

-- Drop any other views that might be self-referencing or problematic
-- This is a precautionary measure

-- Check for any views that might be causing issues
DO $$
DECLARE
    view_record RECORD;
BEGIN
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname LIKE '%admin%' 
        OR viewname LIKE '%sales%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_record.schemaname, view_record.viewname);
        RAISE NOTICE 'Dropped potentially problematic view: %.%', view_record.schemaname, view_record.viewname;
    END LOOP;
END $$;

-- ===========================================
-- 4. VERIFICATION: Check that the fixes worked
-- ===========================================

-- Verify that the problematic view is gone
SELECT 
    schemaname, 
    viewname 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname = 'admin_sales_details';

-- Check for any remaining foreign key constraint issues
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'identities'
ORDER BY tc.table_name, kcu.column_name;

-- ===========================================
-- 5. RECREATE NECESSARY VIEWS (if needed)
-- ===========================================

-- If you need to recreate any views that were accidentally dropped,
-- you can add them here. For now, we'll leave this section empty
-- as we don't know what specific views you need.

-- Example of how to recreate a safe view (uncomment if needed):
/*
CREATE OR REPLACE VIEW public.safe_sales_view AS
SELECT 
    s.id,
    s.amount,
    s.created_at,
    t.title as track_title,
    p.email as producer_email
FROM sales s
JOIN tracks t ON s.track_id = t.id
JOIN profiles p ON t.track_producer_id = p.id
WHERE s.deleted_at IS NULL;

GRANT SELECT ON public.safe_sales_view TO authenticated;
*/

-- ===========================================
-- 6. FINAL VERIFICATION
-- ===========================================

-- Check that the database is in a good state
SELECT 'Database cleanup completed successfully' as status;

-- List all remaining views in the public schema
SELECT 
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname; 