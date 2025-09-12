-- Add rights holder selection to custom sync requests
-- This allows clients to select a specific record label or publisher when creating custom sync requests

-- Add the preferred_rights_holder_id column to custom_sync_requests table
ALTER TABLE custom_sync_requests 
ADD COLUMN IF NOT EXISTS preferred_rights_holder_id UUID REFERENCES profiles(id);

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_custom_sync_requests_preferred_rights_holder_id 
ON custom_sync_requests(preferred_rights_holder_id);

-- Update RLS policies to allow rights holders to see requests where they are the preferred rights holder
-- Drop existing policies first
DROP POLICY IF EXISTS "Producers can view selected requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Producers can view open requests" ON custom_sync_requests;

-- Create updated policies that include rights holders
CREATE POLICY "Producers and Rights Holders can view selected requests" ON custom_sync_requests
    FOR SELECT USING (
        auth.uid() = selected_producer_id OR 
        auth.uid() = preferred_rights_holder_id
    );

CREATE POLICY "Producers and Rights Holders can view open requests" ON custom_sync_requests
    FOR SELECT USING (
        status = 'open' AND 
        end_date >= NOW()
    );

-- Add policy for rights holders to update requests where they are the preferred rights holder
CREATE POLICY "Rights Holders can update selected requests" ON custom_sync_requests
    FOR UPDATE USING (auth.uid() = preferred_rights_holder_id);

-- Verify the changes
SELECT 'Custom sync requests table updated successfully!' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'custom_sync_requests' 
AND column_name IN ('preferred_rights_holder_id', 'selected_producer_id');
