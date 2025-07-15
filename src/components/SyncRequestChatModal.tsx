import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogOverlay } from './ui/dialog';
import { supabase } from '../lib/supabase';

interface SyncRequestChatModalProps {
  open: boolean;
  onClose: () => void;
  syncRequestId: string;
  submissionId: string;
  currentUserId: string;
  currentUserRole: 'client' | 'producer';
}

interface ChatMessage {
  id: string;
  sync_request_id: string;
  submission_id: string;
  sender_id: string;
  sender_role: 'client' | 'producer';
  message: string;
  created_at: string;
}

export const SyncRequestChatModal: React.FC<SyncRequestChatModalProps> = ({
  open,
  onClose,
  syncRequestId,
  submissionId,
  currentUserId,
  currentUserRole,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sync_request_messages')
      .select('*')
      .eq('sync_request_id', syncRequestId)
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: true });
    if (!error && data) setMessages(data);
    setLoading(false);
  };

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!open) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [open, syncRequestId, submissionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    const { error } = await supabase.from('sync_request_messages').insert({
      sync_request_id: syncRequestId,
      submission_id: submissionId,
      sender_id: currentUserId,
      sender_role: currentUserRole,
      message: newMessage.trim(),
    });
    setSending(false);
    if (!error) {
      setNewMessage('');
      fetchMessages();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogOverlay />
      <DialogContent className="max-w-lg w-full p-0">
        <div className="flex flex-col h-[70vh] bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold">Sync Request Chat</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
            {loading ? (
              <div className="text-center text-gray-400">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-400">No messages yet.</div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`mb-4 flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-lg shadow ${msg.sender_id === currentUserId ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'}`}>
                    <div className="text-xs mb-1 opacity-70">
                      {msg.sender_role === 'client' ? 'Client' : 'Producer'} • {new Date(msg.created_at).toLocaleString()}
                    </div>
                    <div className="whitespace-pre-line break-words">{msg.message}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} className="px-6 py-4 border-t border-gray-200 bg-white flex items-center">
            <input
              type="text"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your message..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              disabled={sending}
              maxLength={1000}
            />
            <button
              type="submit"
              className="ml-3 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              disabled={sending || !newMessage.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 