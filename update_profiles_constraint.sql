-- Update profiles table constraint to include artist_band account type
DO $$
BEGIN
    -- Drop the existing check constraint if it exists
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
    
    -- Add the new check constraint that includes 'artist_band' and 'rights_holder'
    ALTER TABLE profiles ADD CONSTRAINT profiles_account_type_check 
    CHECK (account_type IN ('client', 'producer', 'admin', 'white_label', 'admin,producer', 'rights_holder', 'artist_band'));
    
    RAISE NOTICE 'Profiles table constraint updated successfully';
END $$;
