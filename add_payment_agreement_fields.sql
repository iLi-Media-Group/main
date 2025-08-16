-- Add Payment Agreement Fields to Profiles Table
-- This migration adds fields to track payment agreement acceptance for net payment terms

-- Add payment agreement fields to profiles table
DO $$ 
BEGIN
    -- Add payment_agreement_accepted column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'payment_agreement_accepted') THEN
        ALTER TABLE profiles ADD COLUMN payment_agreement_accepted BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add payment_agreement_accepted_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'payment_agreement_accepted_at') THEN
        ALTER TABLE profiles ADD COLUMN payment_agreement_accepted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Update the is_client_verified_for_net_terms function to include payment agreement check
CREATE OR REPLACE FUNCTION is_client_verified_for_net_terms(client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = client_id 
        AND business_verified = true 
        AND payment_agreement_accepted = true
        AND business_name IS NOT NULL 
        AND business_name != ''
        AND business_structure IS NOT NULL 
        AND business_structure != ''
        AND ein_number IS NOT NULL 
        AND ein_number != ''
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the validate_payment_terms function to include payment agreement check
CREATE OR REPLACE FUNCTION validate_payment_terms(client_id UUID, payment_terms TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Immediate payment is always allowed
    IF payment_terms = 'immediate' THEN
        RETURN TRUE;
    END IF;
    
    -- Net payment terms require business verification AND payment agreement acceptance
    IF payment_terms IN ('net30', 'net60', 'net90') THEN
        RETURN is_client_verified_for_net_terms(client_id);
    END IF;
    
    -- Unknown payment terms are not allowed
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get client payment terms eligibility
CREATE OR REPLACE FUNCTION get_client_payment_terms_eligibility(client_id UUID)
RETURNS TABLE(
    can_use_net_terms BOOLEAN,
    business_verified BOOLEAN,
    payment_agreement_accepted BOOLEAN,
    business_name TEXT,
    business_structure TEXT,
    ein_number TEXT,
    verification_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.business_verified = true AND p.payment_agreement_accepted = true AS can_use_net_terms,
        COALESCE(p.business_verified, false) AS business_verified,
        COALESCE(p.payment_agreement_accepted, false) AS payment_agreement_accepted,
        p.business_name,
        p.business_structure,
        p.ein_number,
        CASE 
            WHEN p.business_verified = true AND p.payment_agreement_accepted = true THEN 'FULLY_VERIFIED'
            WHEN p.business_verified = true AND p.payment_agreement_accepted = false THEN 'NEEDS_AGREEMENT'
            WHEN p.business_verified = false AND p.payment_agreement_accepted = true THEN 'NEEDS_VERIFICATION'
            WHEN p.business_name IS NOT NULL AND p.business_name != '' AND p.business_structure IS NOT NULL AND p.business_structure != '' AND p.ein_number IS NOT NULL AND p.ein_number != '' THEN 'NEEDS_AGREEMENT_AND_VERIFICATION'
            ELSE 'NOT_SUBMITTED'
        END AS verification_status
    FROM profiles p
    WHERE p.id = client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for the new fields
DO $$ 
BEGIN
    -- Allow users to update their own payment agreement fields
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own payment agreement fields') THEN
        CREATE POLICY "Users can update their own payment agreement fields" ON profiles
        FOR UPDATE USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Create an index for efficient queries on payment agreement status
CREATE INDEX IF NOT EXISTS idx_profiles_payment_agreement_status 
ON profiles(business_verified, payment_agreement_accepted) 
WHERE business_verified = true OR payment_agreement_accepted = true;

-- Log the migration
INSERT INTO schema_migrations (version, applied_at) 
VALUES ('add_payment_agreement_fields', NOW())
ON CONFLICT (version) DO NOTHING;

SELECT 'Payment agreement fields added successfully. Migration completed.' AS result;
