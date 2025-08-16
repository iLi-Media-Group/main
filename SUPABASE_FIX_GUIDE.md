# Supabase Database Fix Guide

## Issues Identified by Supabase Team

The Supabase team identified two specific issues that need to be addressed:

1. **Self-referencing view issue**: `admin_sales_details` view with `security_invoker='on'` is causing restoration failure
2. **Foreign key constraint issue**: `identities_user_id_fkey` constraint violation

## How to Fix These Issues

### Step 1: Access Your Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** section
3. Create a new query

### Step 2: Run the Fix Script

Copy and paste the contents of `fix_specific_supabase_issues.sql` into the SQL Editor and run it.

This script will:
- Remove the problematic `admin_sales_details` view
- Clean up orphaned records in the `auth.identities` table
- Verify that the fixes worked
- Provide a status report

### Step 3: Verify the Results

After running the script, you should see output indicating:
- ✅ "VIEW SUCCESSFULLY REMOVED" for the admin_sales_details view
- ✅ "0" remaining orphaned records in the identities table
- ✅ "ALL ISSUES RESOLVED" in the final status report

### Step 4: Contact Supabase Support

Once you've run the fix script:

1. Go back to your Supabase support ticket
2. Inform them that you've addressed both issues:
   - Removed the self-referencing `admin_sales_details` view
   - Cleaned up orphaned records in the `auth.identities` table
3. Ask them to attempt the database restoration again

### Alternative: Manual Database Inspection

If you want to manually check the current state of your database, you can run these queries separately:

```sql
-- Check if the problematic view exists
SELECT 
    schemaname, 
    viewname 
FROM pg_views 
WHERE viewname = 'admin_sales_details';

-- Check for orphaned identities records
SELECT COUNT(*) as orphaned_records
FROM auth.identities i
LEFT JOIN auth.users u ON i.user_id = u.id
WHERE u.id IS NULL;
```

## What the Fix Script Does

### 1. Removes the Problematic View
```sql
DROP VIEW IF EXISTS public.admin_sales_details CASCADE;
DROP VIEW IF EXISTS admin_sales_details CASCADE;
```

### 2. Fixes Foreign Key Constraint Issues
```sql
-- Identifies orphaned records
SELECT COUNT(*) FROM auth.identities i
LEFT JOIN auth.users u ON i.user_id = u.id
WHERE u.id IS NULL;

-- Removes orphaned records
DELETE FROM auth.identities 
WHERE user_id NOT IN (SELECT id FROM auth.users);
```

### 3. Provides Verification
The script includes multiple verification steps to ensure both issues are resolved.

## Important Notes

- **Backup**: The script uses `CASCADE` when dropping views, which will also drop any dependent objects
- **Safety**: The script includes safety checks and will report any remaining issues
- **Recreation**: If you need to recreate any views that were accidentally dropped, you can add them to the script

## Next Steps

1. Run the fix script in your Supabase SQL Editor
2. Verify all issues are resolved
3. Contact Supabase support to request database restoration
4. Test your application once the database is restored

## If Issues Persist

If you encounter any errors when running the fix script:

1. Check the error messages carefully
2. Run the verification queries manually
3. Contact Supabase support with the specific error details
4. Consider running the more comprehensive `fix_supabase_database_issues.sql` script instead 