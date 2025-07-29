/*
  # Fix Specific Supabase Database Issues
  
  This script addresses the exact issues identified by the Supabase team:
  
  1. Remove the self-referencing admin_sales_details view with security_invoker='on'
  2. Fix the foreign key constraint violation: "identities_user_id_fkey"
  
  Run this script in your Supabase SQL Editor to resolve these specific issues.
*/

-- ===========================================
-- 1. FIX: Remove the problematic admin_sales_details view
-- ===========================================

-- Drop the specific view that's causing the restoration failure
-- This view has security_invoker='on' and is self-referencing
DROP VIEW IF EXISTS public.admin_sales_details CASCADE;

-- Also try dropping it without the schema prefix in case it's in a different schema
DROP VIEW IF EXISTS admin_sales_details CASCADE;

-- ===========================================
-- 2. FIX: Address the identities foreign key constraint issue
-- ===========================================

-- The error suggests that there are records in the identities table
-- that reference user_ids that don't exist in the auth.users table

-- First, let's identify the problematic records
SELECT 
    'Orphaned identities records' as issue_type,
    COUNT(*) as count
FROM auth.identities i
LEFT JOIN auth.users u ON i.user_id = u.id
WHERE u.id IS NULL;

-- Clean up orphaned identities records
DELETE FROM auth.identities 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Verify the cleanup worked
SELECT 
    'Remaining identities records' as check_type,
    COUNT(*) as count
FROM auth.identities i
LEFT JOIN auth.users u ON i.user_id = u.id
WHERE u.id IS NULL;

-- ===========================================
-- 3. VERIFICATION: Confirm fixes worked
-- ===========================================

-- Check that the problematic view is gone
SELECT 
    'admin_sales_details view check' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_views 
            WHERE viewname = 'admin_sales_details' 
            AND schemaname = 'public'
        ) THEN 'VIEW STILL EXISTS - NEEDS MANUAL REMOVAL'
        ELSE 'VIEW SUCCESSFULLY REMOVED'
    END as status;

-- Check for any remaining foreign key constraint issues
SELECT 
    'Foreign key constraint check' as check_type,
    COUNT(*) as remaining_orphaned_records
FROM auth.identities i
LEFT JOIN auth.users u ON i.user_id = u.id
WHERE u.id IS NULL;

-- ===========================================
-- 4. ADDITIONAL SAFETY CHECKS
-- ===========================================

-- List all views in the public schema to ensure no other problematic views exist
SELECT 
    'Current public schema views' as check_type,
    viewname,
    schemaname
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- Check for any views with security_invoker that might be problematic
SELECT 
    'Security invoker views check' as check_type,
    viewname,
    schemaname
FROM pg_views 
WHERE schemaname = 'public'
AND definition LIKE '%security_invoker%'
ORDER BY viewname;

-- ===========================================
-- 5. FINAL STATUS REPORT
-- ===========================================

SELECT 
    'Database fix status' as check_type,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_views 
            WHERE viewname = 'admin_sales_details' 
            AND schemaname = 'public'
        ) 
        AND NOT EXISTS (
            SELECT 1 FROM auth.identities i
            LEFT JOIN auth.users u ON i.user_id = u.id
            WHERE u.id IS NULL
        ) THEN 'ALL ISSUES RESOLVED'
        ELSE 'SOME ISSUES REMAIN - CHECK ABOVE RESULTS'
    END as status; 