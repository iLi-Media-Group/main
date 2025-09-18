# Rights Integration Test Plan

## Overview
Test the new music rights system that allows producers to specify rights holder information during track upload.

## Test Cases

### 1. Database Structure Test
- [ ] Verify `music_rights` table exists
- [ ] Verify all required columns are present
- [ ] Verify RLS policies are in place
- [ ] Verify indexes are created

### 2. Track Upload Form UI Test
- [ ] Rights Holder Information section is visible
- [ ] All form fields are present:
  - Rights Holder Name
  - Rights Holder Type (dropdown: producer, record_label, publisher, other)
  - Rights Holder Email
  - Rights Holder Phone
  - Rights Holder Address
  - Rights Declaration checkbox
- [ ] Form validation works correctly
- [ ] Form persistence saves rights holder data

### 3. Data Insertion Test
- [ ] Upload a track with rights holder information
- [ ] Verify data is inserted into `music_rights` table
- [ ] Verify all fields are saved correctly
- [ ] Verify relationships with `tracks` and `profiles` tables

### 4. Integration Test
- [ ] Test with existing track upload workflow
- [ ] Verify no conflicts with other form sections
- [ ] Test form reset functionality
- [ ] Test error handling

## Manual Test Steps

1. **Navigate to Track Upload Form**
   - Go to producer dashboard
   - Click "Upload Track"
   - Verify Rights Holder Information section is present

2. **Fill Rights Holder Information**
   - Enter rights holder name
   - Select rights holder type
   - Enter email and phone
   - Enter address
   - Check rights declaration

3. **Complete Track Upload**
   - Fill other required fields
   - Submit the form
   - Verify success message

4. **Verify Database**
   - Check `music_rights` table for new record
   - Verify all data is correctly stored

## Expected Results
- Rights holder information is properly collected and stored
- No errors during track upload process
- Data integrity is maintained
- UI is user-friendly and intuitive

## Status: ✅ READY FOR TESTING
