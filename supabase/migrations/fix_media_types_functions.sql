-- Fix media types RPC functions with proper permissions
-- This addresses the 400 errors when calling the functions

-- Drop and recreate the functions with proper security settings

-- 1. Fix get_media_types_with_subtypes function
DROP FUNCTION IF EXISTS get_media_types_with_subtypes();

CREATE OR REPLACE FUNCTION get_media_types_with_subtypes()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category TEXT,
    parent_id UUID,
    is_parent BOOLEAN,
    display_order INTEGER,
    sub_types JSON
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mt.id,
        mt.name,
        mt.description,
        mt.category,
        mt.parent_id,
        mt.is_parent,
        mt.display_order,
        COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'id', st.id,
                    'name', st.name,
                    'description', st.description,
                    'category', st.category,
                    'display_order', st.display_order
                ) ORDER BY st.display_order
            )
            FROM media_types st 
            WHERE st.parent_id = mt.id),
            '[]'::json
        ) as sub_types
    FROM media_types mt
    WHERE mt.is_parent = true OR mt.parent_id IS NULL
    ORDER BY mt.display_order, mt.name;
END;
$$;

-- 2. Fix get_all_media_types_for_selection function
DROP FUNCTION IF EXISTS get_all_media_types_for_selection();

CREATE OR REPLACE FUNCTION get_all_media_types_for_selection()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category TEXT,
    parent_id UUID,
    is_parent BOOLEAN,
    display_order INTEGER,
    full_name TEXT
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mt.id,
        mt.name,
        mt.description,
        mt.category,
        mt.parent_id,
        mt.is_parent,
        mt.display_order,
        CASE 
            WHEN mt.parent_id IS NOT NULL THEN 
                (SELECT name FROM media_types WHERE id = mt.parent_id) || ' > ' || mt.name
            ELSE mt.name
        END as full_name
    FROM media_types mt
    ORDER BY 
        COALESCE(mt.parent_id, mt.id),
        mt.display_order,
        mt.name;
END;
$$;

-- 3. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_media_types_with_subtypes() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_media_types_for_selection() TO authenticated;

-- 4. Ensure RLS policies are in place for media_types table
DROP POLICY IF EXISTS "Allow read access to media types" ON media_types;
CREATE POLICY "Allow read access to media types" ON media_types
    FOR SELECT USING (auth.role() = 'authenticated');

-- 5. Enable RLS on media_types if not already enabled
ALTER TABLE media_types ENABLE ROW LEVEL SECURITY;

-- Fix custom sync compensation rate to use custom_sync_rate instead of sync_fee_rate
CREATE OR REPLACE FUNCTION sync_custom_sync_to_transactions()
RETURNS TRIGGER AS $$
DECLARE
    v_producer_amount numeric;
    v_compensation_settings record;
BEGIN
    -- Only process when payment_status changes to 'paid' and selected_producer_id is set
    IF NEW.payment_status = 'paid' AND NEW.selected_producer_id IS NOT NULL THEN
        -- Get compensation settings
        SELECT * INTO v_compensation_settings FROM compensation_settings LIMIT 1;
        
        -- Default to 90% if no settings found (custom sync rate)
        IF v_compensation_settings IS NULL THEN
            v_producer_amount := COALESCE(NEW.final_amount, NEW.sync_fee) * 0.90;
        ELSE
            v_producer_amount := COALESCE(NEW.final_amount, NEW.sync_fee) * (v_compensation_settings.custom_sync_rate / 100.0);
        END IF;
        
        -- Create transaction record if it doesn't exist
        INSERT INTO producer_transactions (
            transaction_producer_id,
            amount,
            type,
            status,
            description,
            track_title,
            reference_id,
            created_at
        )
        VALUES (
            NEW.selected_producer_id,
            v_producer_amount,
            'sale',
            'pending',
            'Custom Sync: ' || COALESCE(NEW.project_title, 'Custom Sync Request'),
            COALESCE(NEW.project_title, 'Custom Sync Request'),
            NEW.id::text,
            NEW.updated_at
        )
        ON CONFLICT (reference_id) DO NOTHING;
        
        -- Update producer balance - only update lifetime_earnings, let pending_balance be calculated by separate function
        INSERT INTO producer_balances (
            balance_producer_id,
            pending_balance,
            available_balance,
            lifetime_earnings
        )
        VALUES (
            NEW.selected_producer_id,
            0, -- Don't set pending_balance here
            0,
            v_producer_amount
        )
        ON CONFLICT (balance_producer_id) DO UPDATE
        SET 
            lifetime_earnings = producer_balances.lifetime_earnings + EXCLUDED.lifetime_earnings;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS trigger_sync_custom_sync_to_transactions ON custom_sync_requests;
CREATE TRIGGER trigger_sync_custom_sync_to_transactions
  AFTER UPDATE ON custom_sync_requests
  FOR EACH ROW
  EXECUTE FUNCTION sync_custom_sync_to_transactions();

-- Add custom_sync_rate column to compensation_settings if it doesn't exist
ALTER TABLE compensation_settings 
ADD COLUMN IF NOT EXISTS custom_sync_rate INTEGER NOT NULL DEFAULT 90;

-- Update the custom_sync_rate to 90% to match the intended rate
UPDATE compensation_settings 
SET custom_sync_rate = 90 
WHERE id = 1;

-- Verify the fix
SELECT 'Custom sync compensation rate fixed' as status;
SELECT 
    sync_fee_rate as sync_proposal_rate,
    custom_sync_rate as custom_sync_rate
FROM compensation_settings 
WHERE id = 1;
