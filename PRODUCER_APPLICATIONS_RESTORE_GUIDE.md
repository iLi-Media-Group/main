# Producer Applications Restoration Guide

## Issue
After the Supabase database restoration, the Producer Applications functionality is no longer showing in the admin dashboard. This is likely because:

1. The `producer_applications` table was lost or corrupted
2. The `producer_onboarding` feature flag was disabled
3. RLS policies were not properly restored
4. Admin account types may have been reset

## Solution

### Step 1: Run the Restoration Script

1. **Go to your Supabase Dashboard**
   - Navigate to the **SQL Editor**
   - Create a new query

2. **Copy and paste the restoration script**
   - Copy the entire contents of `restore_producer_applications.sql`
   - Paste it into the SQL Editor
   - Run the script

### Step 2: Verify the Restoration

After running the script, you should see output confirming:

✅ **Feature flag enabled**: `producer_onboarding` should be enabled globally
✅ **Table created**: `producer_applications` table with all required columns
✅ **RLS policies configured**: Proper access policies for admins
✅ **Test data inserted**: 4 sample applications in different statuses
✅ **Admin accounts updated**: Your admin account type should be set to 'admin'

### Step 3: Check the Admin Dashboard

1. **Refresh your admin dashboard**
2. **Look for the "Producer Applications" tab**
   - It should appear in the tab navigation
   - The tab should show a count of applications

3. **Click on the Producer Applications tab**
   - You should see the applications interface
   - There should be 4 test applications visible
   - You should be able to filter, sort, and manage applications

### Step 4: Test the Functionality

1. **Check the different tabs**:
   - **New Applicants**: Should show 2 applications (John Producer, Sarah Beatmaker)
   - **Invited**: Should show 1 application (Mike Composer)
   - **Save for Later**: Should show 1 application (Alex Beatmaker)
   - **Declined**: Should be empty initially

2. **Test the features**:
   - **Filtering**: Try filtering by genre
   - **Searching**: Try searching by name or email
   - **Sorting**: Try sorting by date, genre, or ranking
   - **Actions**: Try updating application status

### Step 5: If Issues Persist

If the Producer Applications tab still doesn't appear:

1. **Check your browser console** for any JavaScript errors
2. **Verify your account type**:
   ```sql
   SELECT email, account_type FROM profiles 
   WHERE email = 'your-email@example.com';
   ```

3. **Check the feature flag**:
   ```sql
   SELECT * FROM white_label_features 
   WHERE feature_name = 'producer_onboarding';
   ```

4. **Check if the table exists**:
   ```sql
   SELECT COUNT(*) FROM producer_applications;
   ```

### Step 6: Manual Verification Queries

Run these queries to verify everything is working:

```sql
-- Check feature flag
SELECT 'Feature Flag:' as info, client_id, feature_name, is_enabled 
FROM white_label_features 
WHERE feature_name = 'producer_onboarding';

-- Check your account type
SELECT 'Account Type:' as info, email, account_type 
FROM profiles 
WHERE email = 'knockriobeats@gmail.com';

-- Check applications
SELECT 'Applications:' as info, COUNT(*) as total 
FROM producer_applications;

-- Check applications by status
SELECT 'By Status:' as info, status, COUNT(*) as count 
FROM producer_applications 
GROUP BY status;
```

## Expected Results

After running the restoration script, you should see:

- **4 total applications** in the database
- **2 applications** in the "New" tab
- **1 application** in the "Invited" tab  
- **1 application** in the "Save for Later" tab
- **Producer Applications tab** visible in the admin dashboard
- **All filtering and sorting features** working properly

## Troubleshooting

### If the tab doesn't appear:
1. Check that your account type is 'admin'
2. Verify the feature flag is enabled
3. Clear your browser cache and refresh

### If applications don't load:
1. Check the browser console for errors
2. Verify the RLS policies are correct
3. Check that the table structure is complete

### If you get permission errors:
1. Run the RLS policy creation part of the script again
2. Verify your user has admin privileges

## Next Steps

Once the Producer Applications are restored:

1. **Test the full workflow**:
   - View application details
   - Update application status
   - Invite producers
   - Export data

2. **Add real applications** if needed:
   - You can submit test applications through the public form
   - Or manually insert applications via SQL

3. **Configure any additional settings**:
   - Update ranking criteria if needed
   - Adjust auto-rejection rules
   - Set up email notifications

The restoration script should completely restore the Producer Applications functionality to its previous working state. 