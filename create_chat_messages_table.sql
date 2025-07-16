-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  room_id UUID DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_recipient ON chat_messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see messages they sent or received
CREATE POLICY "Users can view their own messages" ON chat_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

-- RLS Policy: Users can only insert messages where they are the sender
CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

-- RLS Policy: Users can only update their own messages
CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (
    auth.uid() = sender_id
  );

-- RLS Policy: Users can only delete their own messages
CREATE POLICY "Users can delete their own messages" ON chat_messages
  FOR DELETE USING (
    auth.uid() = sender_id
  );

-- Grant permissions to authenticated users
GRANT ALL ON chat_messages TO authenticated;
GRANT USAGE ON SEQUENCE chat_messages_id_seq TO authenticated; 