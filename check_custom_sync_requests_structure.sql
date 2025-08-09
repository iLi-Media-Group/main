-- Check the current structure of custom_sync_requests table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'custom_sync_requests'
ORDER BY ordinal_position;

-- Check if there are any constraint violations
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='custom_sync_requests';

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add submission_email column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'submission_email'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN submission_email TEXT;
    END IF;
    
    -- Add payment_terms column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'payment_terms'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN payment_terms TEXT DEFAULT 'immediate';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'status'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN status TEXT DEFAULT 'open';
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;
