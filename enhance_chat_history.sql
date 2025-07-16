-- Enhance cust_sync_chat table with additional features for better chat history management

-- Add columns for message status and read receipts
ALTER TABLE cust_sync_chat 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'notification'));

-- Create index for read status queries
CREATE INDEX IF NOT EXISTS idx_cust_sync_chat_read_status ON cust_sync_chat(recipient_id, is_read);

-- Create a view for unread message counts per user per sync request
CREATE OR REPLACE VIEW unread_message_counts AS
SELECT 
  recipient_id,
  sync_request_id,
  COUNT(*) as unread_count
FROM cust_sync_chat 
WHERE is_read = FALSE 
GROUP BY recipient_id, sync_request_id;

-- Create a function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_recipient_id UUID,
  p_sync_request_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE cust_sync_chat 
  SET is_read = TRUE, read_at = NOW()
  WHERE recipient_id = p_recipient_id 
    AND sync_request_id = p_sync_request_id 
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get chat summary for a sync request
CREATE OR REPLACE FUNCTION get_chat_summary(p_sync_request_id UUID)
RETURNS TABLE(
  total_messages BIGINT,
  unread_messages BIGINT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  participants_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE is_read = FALSE) as unread_messages,
    MAX(created_at) as last_message_at,
    COUNT(DISTINCT sender_id) as participants_count
  FROM cust_sync_chat 
  WHERE sync_request_id = p_sync_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON unread_message_counts TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_chat_summary(UUID) TO authenticated; 