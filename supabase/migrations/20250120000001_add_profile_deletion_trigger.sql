-- Migration: Add trigger to delete auth user when profile is deleted
-- This ensures that when a profile is deleted, the corresponding auth user is also deleted
-- preventing users from logging in with deleted accounts

-- Create a function to delete auth user when profile is deleted
CREATE OR REPLACE FUNCTION delete_auth_user_on_profile_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the auth user when their profile is deleted
  DELETE FROM auth.users WHERE id = OLD.id;
  
  -- Return the old record to complete the trigger
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_profile_deletion ON profiles;
CREATE TRIGGER trigger_delete_auth_user_on_profile_deletion
  AFTER DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION delete_auth_user_on_profile_deletion();

-- Add comment to document the trigger
COMMENT ON FUNCTION delete_auth_user_on_profile_deletion() IS 'Automatically deletes the corresponding auth user when a profile is deleted to prevent login with deleted accounts'; 