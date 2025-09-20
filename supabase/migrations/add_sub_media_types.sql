-- Add sub-media types support to media types system
-- This allows main media types (like "Sports") to have sub-types (like "NFL", "NBA", "MLB")

-- 1. Add parent_id column to media_types table to support hierarchy
ALTER TABLE media_types ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES media_types(id) ON DELETE CASCADE;

-- 2. Add is_parent column to easily identify parent media types
ALTER TABLE media_types ADD COLUMN IF NOT EXISTS is_parent BOOLEAN DEFAULT false;

-- 3. Add display_order column for better organization
ALTER TABLE media_types ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_types_parent_id ON media_types(parent_id);
CREATE INDEX IF NOT EXISTS idx_media_types_is_parent ON media_types(is_parent);
CREATE INDEX IF NOT EXISTS idx_media_types_display_order ON media_types(display_order);

-- 5. Update existing media types to mark some as parents and add sub-types
-- First, let's identify which existing media types should be parents
UPDATE media_types SET is_parent = true WHERE name IN ('Sports', 'TV Shows', 'Films', 'Commercials', 'Podcasts', 'Video Games');

-- 6. Insert sub-media types for Sports
INSERT INTO media_types (name, description, category, parent_id, is_parent, display_order) VALUES
-- Sports sub-types
('NFL', 'National Football League content', 'other', (SELECT id FROM media_types WHERE name = 'Sports'), false, 1),
('NBA', 'National Basketball Association content', 'other', (SELECT id FROM media_types WHERE name = 'Sports'), false, 2),
('MLB', 'Major League Baseball content', 'other', (SELECT id FROM media_types WHERE name = 'Sports'), false, 3),
('NHL', 'National Hockey League content', 'other', (SELECT id FROM media_types WHERE name = 'Sports'), false, 4),
('NCAA', 'National Collegiate Athletic Association content', 'other', (SELECT id FROM media_types WHERE name = 'Sports'), false, 5),
('NCAAW', 'NCAA Women''s sports content', 'other', (SELECT id FROM media_types WHERE name = 'Sports'), false, 6),
('Soccer', 'Soccer and football content', 'other', (SELECT id FROM media_types WHERE name = 'Sports'), false, 7),
('Olympics', 'Olympic Games content', 'other', (SELECT id FROM media_types WHERE name = 'Sports'), false, 8),
('ESPN', 'ESPN sports content', 'other', (SELECT id FROM media_types WHERE name = 'Sports'), false, 9),
('SportsCenter', 'SportsCenter and sports news content', 'other', (SELECT id FROM media_types WHERE name = 'Sports'), false, 10);

-- 7. Insert sub-media types for TV Shows
INSERT INTO media_types (name, description, category, parent_id, is_parent, display_order) VALUES
-- TV Shows sub-types
('Reality TV', 'Reality television shows', 'video', (SELECT id FROM media_types WHERE name = 'TV Shows'), false, 1),
('Drama Series', 'Drama television series', 'video', (SELECT id FROM media_types WHERE name = 'TV Shows'), false, 2),
('Comedy Series', 'Comedy television series', 'video', (SELECT id FROM media_types WHERE name = 'TV Shows'), false, 3),
('News Programs', 'News and current events programs', 'video', (SELECT id FROM media_types WHERE name = 'TV Shows'), false, 4),
('Talk Shows', 'Talk shows and interviews', 'video', (SELECT id FROM media_types WHERE name = 'TV Shows'), false, 5),
('Game Shows', 'Game shows and competitions', 'video', (SELECT id FROM media_types WHERE name = 'TV Shows'), false, 6),
('Documentary Series', 'Documentary television series', 'video', (SELECT id FROM media_types WHERE name = 'TV Shows'), false, 7),
('Children''s Programming', 'Children''s television programming', 'video', (SELECT id FROM media_types WHERE name = 'TV Shows'), false, 8);

-- 8. Insert sub-media types for Films
INSERT INTO media_types (name, description, category, parent_id, is_parent, display_order) VALUES
-- Films sub-types
('Feature Films', 'Full-length feature films', 'video', (SELECT id FROM media_types WHERE name = 'Films'), false, 1),
('Short Films', 'Short films and independent cinema', 'video', (SELECT id FROM media_types WHERE name = 'Films'), false, 2),
('Documentary Films', 'Documentary films', 'video', (SELECT id FROM media_types WHERE name = 'Films'), false, 3),
('Independent Films', 'Independent and art house films', 'video', (SELECT id FROM media_types WHERE name = 'Films'), false, 4),
('Blockbuster Films', 'Major studio blockbuster films', 'video', (SELECT id FROM media_types WHERE name = 'Films'), false, 5);

-- 9. Insert sub-media types for Commercials
INSERT INTO media_types (name, description, category, parent_id, is_parent, display_order) VALUES
-- Commercials sub-types
('TV Commercials', 'Television advertisements', 'video', (SELECT id FROM media_types WHERE name = 'Commercials'), false, 1),
('Digital Ads', 'Digital and online advertisements', 'video', (SELECT id FROM media_types WHERE name = 'Commercials'), false, 2),
('Radio Ads', 'Radio advertisements', 'audio', (SELECT id FROM media_types WHERE name = 'Commercials'), false, 3),
('Product Launches', 'Product launch campaigns', 'video', (SELECT id FROM media_types WHERE name = 'Commercials'), false, 4),
('Brand Campaigns', 'Brand awareness campaigns', 'video', (SELECT id FROM media_types WHERE name = 'Commercials'), false, 5);

-- 10. Insert sub-media types for Podcasts
INSERT INTO media_types (name, description, category, parent_id, is_parent, display_order) VALUES
-- Podcasts sub-types
('True Crime', 'True crime podcast content', 'audio', (SELECT id FROM media_types WHERE name = 'Podcasts'), false, 1),
('Business', 'Business and entrepreneurship podcasts', 'audio', (SELECT id FROM media_types WHERE name = 'Podcasts'), false, 2),
('Comedy', 'Comedy and entertainment podcasts', 'audio', (SELECT id FROM media_types WHERE name = 'Podcasts'), false, 3),
('News & Politics', 'News and political podcasts', 'audio', (SELECT id FROM media_types WHERE name = 'Podcasts'), false, 4),
('Health & Wellness', 'Health and wellness podcasts', 'audio', (SELECT id FROM media_types WHERE name = 'Podcasts'), false, 5),
('Technology', 'Technology and science podcasts', 'audio', (SELECT id FROM media_types WHERE name = 'Podcasts'), false, 6),
('Education', 'Educational and learning podcasts', 'audio', (SELECT id FROM media_types WHERE name = 'Podcasts'), false, 7);

-- 11. Insert sub-media types for Video Games
INSERT INTO media_types (name, description, category, parent_id, is_parent, display_order) VALUES
-- Video Games sub-types
('Action Games', 'Action and adventure video games', 'digital', (SELECT id FROM media_types WHERE name = 'Video Games'), false, 1),
('RPG Games', 'Role-playing video games', 'digital', (SELECT id FROM media_types WHERE name = 'Video Games'), false, 2),
('Sports Games', 'Sports video games', 'digital', (SELECT id FROM media_types WHERE name = 'Video Games'), false, 3),
('Racing Games', 'Racing and driving video games', 'digital', (SELECT id FROM media_types WHERE name = 'Video Games'), false, 4),
('Strategy Games', 'Strategy and simulation video games', 'digital', (SELECT id FROM media_types WHERE name = 'Video Games'), false, 5),
('Mobile Games', 'Mobile and casual video games', 'digital', (SELECT id FROM media_types WHERE name = 'Video Games'), false, 6),
('Indie Games', 'Independent video games', 'digital', (SELECT id FROM media_types WHERE name = 'Video Games'), false, 7);

-- 12. Create a function to get media types with their sub-types
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
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create a function to get all media types (parents and children) for track selection
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
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Update RLS policies to include new columns
-- The existing policies should work with the new columns, but let's ensure they're comprehensive
DROP POLICY IF EXISTS "Allow read access to media types" ON media_types;
CREATE POLICY "Allow read access to media types" ON media_types
    FOR SELECT USING (auth.role() = 'authenticated');

-- 15. Add comments for documentation
COMMENT ON COLUMN media_types.parent_id IS 'Reference to parent media type for hierarchical organization';
COMMENT ON COLUMN media_types.is_parent IS 'Indicates if this media type can have sub-types';
COMMENT ON COLUMN media_types.display_order IS 'Order for displaying media types within their category/parent';

-- 16. Create a view for easier querying of the hierarchy
CREATE OR REPLACE VIEW media_types_hierarchy AS
SELECT 
    mt.id,
    mt.name,
    mt.description,
    mt.category,
    mt.parent_id,
    mt.is_parent,
    mt.display_order,
    p.name as parent_name,
    CASE 
        WHEN mt.parent_id IS NOT NULL THEN p.name || ' > ' || mt.name
        ELSE mt.name
    END as full_name
FROM media_types mt
LEFT JOIN media_types p ON mt.parent_id = p.id
ORDER BY 
    COALESCE(mt.parent_id, mt.id),
    mt.display_order,
    mt.name;

-- 17. Add comments for documentation
COMMENT ON COLUMN media_types.parent_id IS 'Reference to parent media type for hierarchical organization';
COMMENT ON COLUMN media_types.is_parent IS 'Indicates if this media type can have sub-types';
COMMENT ON COLUMN media_types.display_order IS 'Order for displaying media types within their category/parent';
