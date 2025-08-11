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
