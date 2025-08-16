# Producer Test Accounts Setup Guide

## Step 1: Create Invitation Codes

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the `create_producer_test_accounts.sql` script
4. Verify that 2 invitation codes were created:
   - `TEST_PRODUCER_001` for testproducer1@mybeatfi.io
   - `TEST_PRODUCER_002` for testproducer2@mybeatfi.io

## Step 2: Create Test Accounts

### Test Producer 1
- **Email:** testproducer1@mybeatfi.io
- **Invitation Code:** TEST_PRODUCER_001
- **Password:** TestProducer123!
- **Account Type:** Producer
- **IPI Number:** 123456789
- **Performing Rights Org:** ASCAP

### Test Producer 2
- **Email:** testproducer2@mybeatfi.io
- **Invitation Code:** TEST_PRODUCER_002
- **Password:** TestProducer456!
- **Account Type:** Producer
- **IPI Number:** 987654321
- **Performing Rights Org:** BMI

## Step 3: Signup Process

1. Go to your app's signup page
2. Fill out the form with the test account details above
3. Use the corresponding invitation code
4. Complete the signup process
5. Verify the account was created successfully

## Step 4: Verify Accounts

After signup, verify that:
- ✅ Account type is set to "producer"
- ✅ Profile was created with all fields
- ✅ Can access producer dashboard
- ✅ Can upload tracks
- ✅ Invitation code was marked as used

## Troubleshooting

If you get "Invalid or expired producer invitation code":
1. Check that the invitation codes exist in the database
2. Verify the email matches the invitation code
3. Make sure the code hasn't been used already

If you get duplicate email errors:
1. The fix we just implemented should prevent this
2. Try using different test emails if needed 