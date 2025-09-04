-- Fix background assets to have complete signed URLs with tokens
-- This updates the database with the working signed URLs

-- ============================================
-- 1. UPDATE HERO VIDEO WITH COMPLETE SIGNED URL
-- ============================================

UPDATE background_assets
SET url = 'https://yciqkebqlajqbpwlujma.supabase.co/storage/v1/object/sign/background-videos/1754741941348_Untitled%20design.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV83NDQ3ZjM1MC1jMTE3LTQyN2MtYjU0MS1mOWQ1ZWRmM2U2NTgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiYWNrZ3JvdW5kLXZpZGVvcy8xNzU0NzQxOTQxMzQ4X1VudGl0bGVkIGRlc2lnbi5tcDQiLCJpYXQiOjE3NTcwMDM4ODIsImV4cCI6NDg3OTA2Nzg4Mn0.Lb1mbfxKz7zjvy2xK2OkmWufnOMxRVpa0JUSfGMhHHk'
WHERE name = 'Untitled design.mp4' 
  AND page = 'hero' 
  AND type = 'video';

-- ============================================
-- 2. VERIFICATION
-- ============================================

-- Show the updated background assets
SELECT 
    'Updated background assets:' as info,
    id,
    name,
    url,
    type,
    page,
    "isActive",
    created_at
FROM background_assets 
ORDER BY page, created_at DESC;

-- ============================================
-- 3. FINAL STATUS
-- ============================================

SELECT 'Hero video signed URL updated with complete token!' as final_status;
SELECT 'The video should now play properly in the hero section.' as next_steps;
