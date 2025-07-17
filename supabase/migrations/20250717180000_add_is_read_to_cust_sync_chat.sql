-- Add is_read column to cust_sync_chat for message read tracking
ALTER TABLE cust_sync_chat ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Index for efficient unread message queries
CREATE INDEX IF NOT EXISTS idx_cust_sync_chat_recipient_is_read ON cust_sync_chat(recipient_id, is_read); 