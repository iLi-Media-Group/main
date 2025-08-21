# Fix Rights Holders Signup Issues

## Issues Identified

1. **422 Error on Signup**: Database tables don't exist or have validation issues
2. **406 Errors on Database Queries**: Tables don't exist or RLS policies are missing
3. **Mail Import Error**: Temporary build issue (resolved)

## Step-by-Step Fix

### Step 1: Deploy Database Schema

Run the `deploy_rights_holders_system.sql` script in your Supabase SQL editor to create:
- `rights_holders` table
- `rights_holder_profiles` table  
- RLS policies
- Indexes and triggers

### Step 2: Test Database Connection

Run the `test_rights_holders_tables.sql` script to verify:
- Tables exist
- RLS is enabled
- Policies are in place

### Step 3: Verify Signup Flow

The signup process should now work correctly:
1. User fills out form
2. Supabase auth creates user
3. Rights holder record is created
4. Profile is fetched

### Step 4: Check for Additional Issues

If issues persist, check:
- Supabase project settings
- Email confirmation settings
- RLS policy permissions

## Expected Behavior After Fix

1. **Signup**: Should create user and rights holder record successfully
2. **Login**: Should authenticate and fetch rights holder data
3. **Dashboard**: Should display rights holder dashboard
4. **Database Queries**: Should return data without 406 errors

## Troubleshooting

### If 422 Error Persists
- Check Supabase auth settings
- Verify email format validation
- Check for duplicate email constraints

### If 406 Error Persists  
- Verify tables exist in database
- Check RLS policies are active
- Ensure user has proper permissions

### If Mail Error Returns
- Rebuild the application: `npm run build`
- Clear browser cache
- Check for missing imports in components
