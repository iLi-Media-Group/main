-- Check if related_tracks table exists and show its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'related_tracks'
ORDER BY ordinal_position;

-- Check if there are any related tracks in the database
SELECT 
    rt.id,
    rt.track_id,
    rt.related_track_id,
    rt.relationship_type,
    rt.created_at,
    t1.title as main_track_title,
    t2.title as related_track_title
FROM related_tracks rt
JOIN tracks t1 ON rt.track_id = t1.id
JOIN tracks t2 ON rt.related_track_id = t2.id
ORDER BY rt.created_at DESC
LIMIT 10;

-- Check RLS policies on related_tracks table
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
WHERE tablename = 'related_tracks';
