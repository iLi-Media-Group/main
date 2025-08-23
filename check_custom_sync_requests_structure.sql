-- Check the exact structure of custom_sync_requests table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'custom_sync_requests'
ORDER BY ordinal_position;

-- Check what data actually exists in the table
SELECT 
  'Sample data' as info,
  *
FROM custom_sync_requests 
LIMIT 5;

-- Add selected_rights_holder_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'selected_rights_holder_id'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN selected_rights_holder_id UUID REFERENCES profiles(id);
        RAISE NOTICE 'Added selected_rights_holder_id column to custom_sync_requests table';
    ELSE
        RAISE NOTICE 'selected_rights_holder_id column already exists';
    END IF;
END $$;

-- Check the structure again after potential addition
SELECT 
  'Updated structure' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'custom_sync_requests'
ORDER BY ordinal_position;
