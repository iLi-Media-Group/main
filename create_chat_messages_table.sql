-- Create cust_sync_chat table for custom sync request chat messages
CREATE TABLE IF NOT EXISTS cust_sync_chat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sync_request_id UUID REFERENCES custom_sync_requests(id) ON DELETE CASCADE,
  room_id UUID DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_cust_sync_chat_sender_recipient ON cust_sync_chat(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_cust_sync_chat_request ON cust_sync_chat(sync_request_id);
CREATE INDEX IF NOT EXISTS idx_cust_sync_chat_created_at ON cust_sync_chat(created_at);

-- Enable Row Level Security
ALTER TABLE cust_sync_chat ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see messages they sent or received
CREATE POLICY "Users can view their own sync chat messages" ON cust_sync_chat
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

-- RLS Policy: Users can only insert messages where they are the sender
CREATE POLICY "Users can send sync chat messages" ON cust_sync_chat
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

-- RLS Policy: Users can only update their own messages
CREATE POLICY "Users can update their own sync chat messages" ON cust_sync_chat
  FOR UPDATE USING (
    auth.uid() = sender_id
  );

-- RLS Policy: Users can only delete their own messages
CREATE POLICY "Users can delete their own sync chat messages" ON cust_sync_chat
  FOR DELETE USING (
    auth.uid() = sender_id
  );

-- Grant permissions to authenticated users
GRANT ALL ON cust_sync_chat TO authenticated; 