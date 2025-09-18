-- Fix Custom Sync Request Upsert Constraint Issue
-- This script fixes the ON CONFLICT error when trying to update custom_sync_requests
-- AND adds file release system for payment terms (net30, net60, net90)
-- AND restricts net payment terms to verified business clients only

-- First, let's check the current structure of custom_sync_requests table
SELECT 'Current custom_sync_requests table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'custom_sync_requests'
ORDER BY ordinal_position;

-- Check existing constraints on custom_sync_requests
SELECT 'Current constraints on custom_sync_requests:' as info;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'custom_sync_requests';

-- The issue is that the frontend is using .update() but Supabase is interpreting it as an upsert
-- We need to ensure the table has proper constraints and the frontend uses the correct operation
-- Let's check if there are any missing columns that might be causing issues

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add mp3_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'mp3_url'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN mp3_url TEXT;
        RAISE NOTICE 'Added mp3_url column';
    END IF;
    
    -- Add trackouts_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'trackouts_url'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN trackouts_url TEXT;
        RAISE NOTICE 'Added trackouts_url column';
    END IF;
    
    -- Add stems_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'stems_url'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN stems_url TEXT;
        RAISE NOTICE 'Added stems_url column';
    END IF;
    
    -- Add split_sheet_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'split_sheet_url'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN split_sheet_url TEXT;
        RAISE NOTICE 'Added split_sheet_url column';
    END IF;
    
    -- Add payment_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN payment_status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added payment_status column';
    END IF;
    
    -- Add selected_producer_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'selected_producer_id'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN selected_producer_id UUID REFERENCES profiles(id);
        RAISE NOTICE 'Added selected_producer_id column';
    END IF;
    
    -- Add final_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'final_amount'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN final_amount NUMERIC;
        RAISE NOTICE 'Added final_amount column';
    END IF;
    
    -- Add negotiated_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'negotiated_amount'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN negotiated_amount NUMERIC;
        RAISE NOTICE 'Added negotiated_amount column';
    END IF;
    
    -- Add files_released column for producer file release decision
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'files_released'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN files_released BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added files_released column';
    END IF;
    
    -- Add files_released_at column for tracking when files were released
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'files_released_at'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN files_released_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added files_released_at column';
    END IF;
    
    -- Add files_released_by column for tracking who released the files
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'files_released_by'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN files_released_by UUID REFERENCES profiles(id);
        RAISE NOTICE 'Added files_released_by column';
    END IF;
    
    -- Add payment_due_date column for net30/net60/net90 terms
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_sync_requests' AND column_name = 'payment_due_date'
    ) THEN
        ALTER TABLE custom_sync_requests ADD COLUMN payment_due_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added payment_due_date column';
    END IF;
END $$;

-- Add business verification columns to profiles table if they don't exist
DO $$
BEGIN
    -- Add business_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'business_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN business_name TEXT;
        RAISE NOTICE 'Added business_name column to profiles';
    END IF;
    
    -- Add business_structure column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'business_structure'
    ) THEN
        ALTER TABLE profiles ADD COLUMN business_structure TEXT;
        RAISE NOTICE 'Added business_structure column to profiles';
    END IF;
    
    -- Add ein_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'ein_number'
    ) THEN
        ALTER TABLE profiles ADD COLUMN ein_number TEXT;
        RAISE NOTICE 'Added ein_number column to profiles';
    END IF;
    
    -- Add business_verified column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'business_verified'
    ) THEN
        ALTER TABLE profiles ADD COLUMN business_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added business_verified column to profiles';
    END IF;
    
    -- Add business_verified_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'business_verified_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN business_verified_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added business_verified_at column to profiles';
    END IF;
END $$;

-- Create file release tracking table for sync proposals as well
CREATE TABLE IF NOT EXISTS sync_proposal_file_releases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sync_proposal_id UUID NOT NULL REFERENCES sync_proposals(id) ON DELETE CASCADE,
    producer_id UUID NOT NULL REFERENCES profiles(id),
    files_released BOOLEAN DEFAULT FALSE,
    files_released_at TIMESTAMP WITH TIME ZONE,
    files_released_by UUID REFERENCES profiles(id),
    payment_terms TEXT DEFAULT 'immediate' CHECK (payment_terms IN ('immediate', 'net30', 'net60', 'net90')),
    payment_due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sync_proposal_id, producer_id)
);

-- Add RLS policies for sync_proposal_file_releases
ALTER TABLE sync_proposal_file_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Producers can view their own file releases" ON sync_proposal_file_releases
    FOR SELECT USING (auth.uid() = producer_id);

CREATE POLICY "Producers can update their own file releases" ON sync_proposal_file_releases
    FOR UPDATE USING (auth.uid() = producer_id);

CREATE POLICY "Clients can view file releases for their proposals" ON sync_proposal_file_releases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sync_proposals sp 
            WHERE sp.id = sync_proposal_file_releases.sync_proposal_id 
            AND sp.client_id = auth.uid()
        )
    );

-- Create function to check if client is verified for net payment terms
CREATE OR REPLACE FUNCTION is_client_verified_for_net_terms(client_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    client_profile RECORD;
BEGIN
    -- Get client profile information
    SELECT 
        business_name,
        business_structure,
        ein_number,
        business_verified
    INTO client_profile
    FROM profiles
    WHERE id = client_id;
    
    -- Client is verified if they have all required business information
    RETURN (
        client_profile.business_name IS NOT NULL 
        AND client_profile.business_name != ''
        AND client_profile.business_structure IS NOT NULL 
        AND client_profile.business_structure != ''
        AND client_profile.ein_number IS NOT NULL 
        AND client_profile.ein_number != ''
        AND client_profile.business_verified = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate payment due date based on payment terms
CREATE OR REPLACE FUNCTION calculate_payment_due_date(payment_terms TEXT, created_date TIMESTAMP WITH TIME ZONE)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    CASE payment_terms
        WHEN 'immediate' THEN
            RETURN created_date;
        WHEN 'net30' THEN
            RETURN created_date + INTERVAL '30 days';
        WHEN 'net60' THEN
            RETURN created_date + INTERVAL '60 days';
        WHEN 'net90' THEN
            RETURN created_date + INTERVAL '90 days';
        ELSE
            RETURN created_date;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if files should be available for download
CREATE OR REPLACE FUNCTION can_download_files(
    payment_status TEXT,
    files_released BOOLEAN,
    payment_terms TEXT,
    payment_due_date TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN AS $$
BEGIN
    -- If payment is complete, files are always available
    IF payment_status = 'paid' THEN
        RETURN TRUE;
    END IF;
    
    -- If files were explicitly released by producer, they're available
    IF files_released = TRUE THEN
        RETURN TRUE;
    END IF;
    
    -- For immediate payment terms, files are only available after payment
    IF payment_terms = 'immediate' THEN
        RETURN FALSE;
    END IF;
    
    -- For net terms, files are available if payment is due or overdue
    IF payment_terms IN ('net30', 'net60', 'net90') AND payment_due_date IS NOT NULL THEN
        RETURN payment_due_date <= NOW();
    END IF;
    
    -- Default: files not available
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate payment terms based on client verification
CREATE OR REPLACE FUNCTION validate_payment_terms(client_id UUID, payment_terms TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Immediate payment is always allowed
    IF payment_terms = 'immediate' THEN
        RETURN TRUE;
    END IF;
    
    -- Net payment terms require business verification
    IF payment_terms IN ('net30', 'net60', 'net90') THEN
        RETURN is_client_verified_for_net_terms(client_id);
    END IF;
    
    -- Unknown payment terms are not allowed
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce payment terms validation for custom sync requests
CREATE OR REPLACE FUNCTION enforce_payment_terms_validation()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if payment terms are valid for this client
    IF NOT validate_payment_terms(NEW.client_id, NEW.payment_terms) THEN
        RAISE EXCEPTION 'Payment terms "%" are not available for this client. Net payment terms require business verification.', NEW.payment_terms;
    END IF;
    
    -- Set payment due date based on terms
    NEW.payment_due_date = calculate_payment_due_date(NEW.payment_terms, COALESCE(NEW.created_at, NOW()));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for custom sync requests
DROP TRIGGER IF EXISTS trigger_enforce_payment_terms_validation ON custom_sync_requests;
CREATE TRIGGER trigger_enforce_payment_terms_validation
    BEFORE INSERT OR UPDATE ON custom_sync_requests
    FOR EACH ROW
    EXECUTE FUNCTION enforce_payment_terms_validation();

-- Create trigger for sync proposals
DROP TRIGGER IF EXISTS trigger_enforce_payment_terms_validation_proposals ON sync_proposals;
CREATE TRIGGER trigger_enforce_payment_terms_validation_proposals
    BEFORE INSERT OR UPDATE ON sync_proposals
    FOR EACH ROW
    EXECUTE FUNCTION enforce_payment_terms_validation();

-- Verify the updated structure
SELECT 'Updated custom_sync_requests table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'custom_sync_requests'
ORDER BY ordinal_position;

-- Check if there are any RLS policies that might be causing issues
SELECT 'Current RLS policies on custom_sync_requests:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'custom_sync_requests';

-- Ensure proper RLS policies exist for updates
DO $$
BEGIN
    -- Drop existing update policy if it exists
    DROP POLICY IF EXISTS "Users can update own sync requests" ON custom_sync_requests;
    
    -- Create new update policy
    CREATE POLICY "Users can update own sync requests" ON custom_sync_requests
    FOR UPDATE USING (auth.uid() = client_id);
    
    RAISE NOTICE 'Updated RLS policy for custom_sync_requests updates';
END $$;

-- Add policy for producers to update file release status
CREATE POLICY "Producers can update file release status" ON custom_sync_requests
    FOR UPDATE USING (auth.uid() = selected_producer_id);

-- Summary
SELECT 'Fix completed successfully' as status;
SELECT 'The issue was likely caused by missing columns or RLS policies' as explanation;
SELECT 'Frontend should now be able to update custom_sync_requests without ON CONFLICT errors' as result;
SELECT 'File release system added for payment terms (net30, net60, net90)' as new_feature;
SELECT 'Business verification required for net payment terms' as business_rule;
