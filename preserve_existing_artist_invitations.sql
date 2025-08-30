-- Preserve Existing Artist Invitations
-- Run this BEFORE running the fix_artist_invitation_system.sql script
-- This will backup any existing invitations

-- ============================================
-- 1. CHECK IF ARTIST_INVITATIONS TABLE EXISTS
-- ============================================

SELECT 'Checking if artist_invitations table exists...' as step;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'artist_invitations'
) as table_exists;

-- ============================================
-- 2. BACKUP EXISTING INVITATIONS
-- ============================================

-- Create backup table if it doesn't exist
CREATE TABLE IF NOT EXISTS artist_invitations_backup (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  artist_number TEXT,
  invitation_code TEXT,
  used BOOLEAN,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  backup_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Copy existing invitations to backup table
INSERT INTO artist_invitations_backup (
  id, email, first_name, last_name, artist_number, 
  invitation_code, used, used_at, expires_at, 
  created_by, created_at, updated_at
)
SELECT 
  id, email, first_name, last_name, artist_number, 
  invitation_code, used, used_at, expires_at, 
  created_by, created_at, updated_at
FROM artist_invitations
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. SHOW BACKUP STATUS
-- ============================================

SELECT 'Backup completed. Existing invitations:' as info;
SELECT 
  COUNT(*) as total_invitations,
  COUNT(CASE WHEN used = FALSE THEN 1 END) as unused_invitations,
  COUNT(CASE WHEN used = TRUE THEN 1 END) as used_invitations
FROM artist_invitations_backup;

-- Show details of backed up invitations
SELECT 'Backed up invitations:' as info;
SELECT 
  id,
  email,
  first_name,
  last_name,
  artist_number,
  invitation_code,
  used,
  created_at,
  expires_at
FROM artist_invitations_backup
ORDER BY created_at DESC;

-- ============================================
-- 4. RESTORE SCRIPT (for after fix)
-- ============================================

SELECT 'After running the fix, you can restore invitations with this script:' as restore_info;
SELECT '-- Restore script (run after fix_artist_invitation_system.sql):' as restore_script;
SELECT 'INSERT INTO artist_invitations (' as restore_script;
SELECT '  id, email, first_name, last_name, artist_number,' as restore_script;
SELECT '  invitation_code, used, used_at, expires_at,' as restore_script;
SELECT '  created_by, created_at, updated_at' as restore_script;
SELECT ')' as restore_script;
SELECT 'SELECT ' as restore_script;
SELECT '  id, email, first_name, last_name, artist_number,' as restore_script;
SELECT '  invitation_code, used, used_at, expires_at,' as restore_script;
SELECT '  created_by, created_at, updated_at' as restore_script;
SELECT 'FROM artist_invitations_backup' as restore_script;
SELECT 'ON CONFLICT (invitation_code) DO NOTHING;' as restore_script;
