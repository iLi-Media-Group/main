-- Check current state of background assets
SELECT 
    id,
    name,
    url,
    type,
    page,
    "isActive",
    created_at
FROM background_assets 
ORDER BY page, created_at DESC;
