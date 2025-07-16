import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, BadgeCheck, Hourglass, Star, Send, MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Dialog } from './ui/dialog';

export default function ProducerSyncSubmission() {
  const { user } = useAuth();
  const location = useLocation();
  const [mp3File, setMp3File] = useState<File | null>(null);
  const [hasStems, setHasStems] = useState(false);
  const [hasTrackouts, setHasTrackouts] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<any>(null);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [trackName, setTrackName] = useState('');
  const [trackBpm, setTrackBpm] = useState('');
  const [trackKey, setTrackKey] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSubmission, setEditSubmission] = useState<any>(null);
  const [editTrackName, setEditTrackName] = useState('');
  const [editTrackBpm, setEditTrackBpm] = useState('');
  const [editTrackKey, setEditTrackKey] = useState('');
  const [editHasStems, setEditHasStems] = useState(false);
  const [editHasTrackouts, setEditHasTrackouts] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get requestId from query string
  const searchParams = new URLSearchParams(location.search);
  const requestId = searchParams.get('requestId');

  // Load chat history for this sync request
  useEffect(() => {
    if (!user || !requestId) return;
    
    const loadChatHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('cust_sync_chat')
          .select(`
            id,
            message,
            created_at,
            is_read,
            recipient_id,
            sender:profiles!sender_id (
              first_name,
              last_name,
              email
            ),
            recipient:profiles!recipient_id (
              first_name,
              last_name,
              email
            )
          `)
          .eq('sync_request_id', requestId)
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: true });
        
        if (!error && data) {
          setChatHistory(data);
          // Count unread messages for this producer
          const unread = data.filter(msg => 
            msg.recipient_id === user.id && !msg.is_read
          ).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error('Error loading chat history:', err);
      }
    };
    
    loadChatHistory();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('producer_chat_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'cust_sync_chat',
          filter: `and(recipient_id=eq.${user.id},sync_request_id=eq.${requestId})`
        }, 
        (payload) => {
          console.log('Producer received new message:', payload);
          // Update unread count
          setUnreadCount(prev => prev + 1);
          // Reload chat history
          loadChatHistory();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, requestId]);

  // Fetch custom sync request info if requestId is present
  useEffect(() => {
    if (!requestId) return;
    setLoadingRequest(true);
    supabase
      .from('custom_sync_requests')
      .select('*')
      .eq('id', requestId)
      .single()
      .then(({ data, error }) => {
        if (!error) setRequestInfo(data);
        setLoadingRequest(false);
      });
  }, [requestId]);

  // Fetch current producer's submissions for this sync request
  useEffect(() => {
    if (!user || !requestId) return;
    const fetchMySubs = async () => {
      const { data, error } = await supabase
        .from('sync_submissions')
        .select('*')
        .eq('producer_id', user.id)
        .eq('sync_request_id', requestId)
        .order('created_at', { ascending: false });
      if (!error && data) setMySubmissions(data);
    };
    fetchMySubs();
  }, [user, requestId, success]);

  // Fetch favorite submission IDs for this sync request
  useEffect(() => {
    if (!mySubmissions.length) return;
    const fetchFavorites = async () => {
      const submissionIds = mySubmissions.map(sub => sub.id);
      if (submissionIds.length === 0) return;
      const { data, error } = await supabase
        .from('sync_submission_favorites')
        .select('sync_submission_id')
        .in('sync_submission_id', submissionIds);
      if (!error && data) setFavoritedIds(new Set(data.map((f: any) => f.sync_submission_id)));
    };
    fetchFavorites();
  }, [mySubmissions, success, editModalOpen]);

  const handleMp3Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'audio/mpeg') {
      setMp3File(file);
      setError(null);
    } else {
      setError('Please upload a valid mp3 file.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!mp3File) {
      setError('Please upload an mp3 file.');
      return;
    }
    if (!requestId) {
      setError('No custom sync request selected.');
      return;
    }
    if (!trackName.trim()) {
      setError('Please enter a track name.');
      return;
    }
    if (!trackBpm.trim() || isNaN(Number(trackBpm))) {
      setError('Please enter a valid BPM (number).');
      return;
    }
    if (!trackKey.trim()) {
      setError('Please enter a track key.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      // Upload mp3 to Supabase storage
      const filePath = `${user.id}/${Date.now()}_${mp3File.name}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('sync-submissions')
        .upload(filePath, mp3File, { upsert: false });
      if (storageError) throw storageError;
      const { data: publicUrlData } = supabase.storage
        .from('sync-submissions')
        .getPublicUrl(filePath);
      const mp3Url = publicUrlData?.publicUrl;
      if (!mp3Url) throw new Error('Failed to get mp3 URL.');
      // Insert submission row
      const { error: dbError } = await supabase.from('sync_submissions').insert({
        producer_id: user.id,
        sync_request_id: requestId,
        track_url: mp3Url,
        track_name: trackName,
        track_bpm: Number(trackBpm),
        track_key: trackKey,
        has_mp3: true,
        has_stems: hasStems,
        has_trackouts: hasTrackouts,
        created_at: new Date().toISOString(),
      });
      if (dbError) throw dbError;
      setSuccess(true);
      setMp3File(null);
      setHasStems(false);
      setHasTrackouts(false);
      setTrackName('');
      setTrackBpm('');
      setTrackKey('');
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setUploading(false);
    }
  };

  // Fetch chat messages with a client
  const fetchChatMessages = async (clientId: string) => {
    if (!user || !requestId) return;
    
    console.log('Producer fetching chat messages for:', {
      user_id: user.id,
      client_id: clientId,
      sync_request_id: requestId
    });
    
    try {
      const { data, error } = await supabase
        .from('cust_sync_chat')
        .select(`
          id,
          message,
          created_at,
          sender:profiles!sender_id (
            first_name,
            last_name,
            email
          )
        `)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${clientId}),and(sender_id.eq.${clientId},recipient_id.eq.${user.id})`)
        .eq('sync_request_id', requestId)
        .order('created_at', { ascending: true });
      
      console.log('Producer fetched chat messages:', { data, error });
      
      if (error) throw error;
      setChatMessages(data || []);
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  // Send a message to a client
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !user || !chatMessage.trim() || !requestId) return;
    
    console.log('Producer sending message:', {
      sender_id: user.id,
      recipient_id: selectedClient.id,
      sync_request_id: requestId,
      message: chatMessage.trim()
    });
    
    setSendingMessage(true);
    try {
      const { data, error } = await supabase
        .from('cust_sync_chat')
        .insert({
          sender_id: user.id,
          recipient_id: selectedClient.id,
          sync_request_id: requestId,
          message: chatMessage.trim(),
          room_id: null // Direct message
        })
        .select();
      
      console.log('Producer message insert result:', { data, error });
      
      if (error) throw error;
      
      setChatMessage('');
      // Refresh messages
      await fetchChatMessages(selectedClient.id);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Open chat with a client
  const handleOpenChat = async (clientId: string, clientName: string) => {
    if (!user) return;
    
    setSelectedClient({ id: clientId, name: clientName });
    setShowChat(true);
    await fetchChatMessages(clientId);
    
    // Mark messages as read when opening chat
    try {
      const { error } = await supabase
        .from('cust_sync_chat')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('sync_request_id', requestId)
        .eq('is_read', false);
      
      if (!error) {
        // Reset unread count
        setUnreadCount(0);
        // Reload chat history to update read status
        const { data, error: reloadError } = await supabase
          .from('cust_sync_chat')
          .select(`
            id,
            message,
            created_at,
            is_read,
            recipient_id,
            sender:profiles!sender_id (
              first_name,
              last_name,
              email
            ),
            recipient:profiles!recipient_id (
              first_name,
              last_name,
              email
            )
          `)
          .eq('sync_request_id', requestId)
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: true });
        
        if (!reloadError && data) {
          setChatHistory(data);
        }
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Close chat dialog
  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedClient(null);
    setChatMessages([]);
    setChatMessage('');
  };

  // Get clients who have messaged this producer
  const getClientsWithMessages = async () => {
    if (!user || !requestId) return [];
    
    try {
      const { data, error } = await supabase
        .from('cust_sync_chat')
        .select(`
          sender:profiles!sender_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('recipient_id', user.id)
        .eq('sync_request_id', requestId)
        .not('sender_id', 'eq', user.id);
      
      if (error) throw error;
      
      // Get unique clients
      const uniqueClients = data?.reduce((acc: any[], message: any) => {
        const clientId = message.sender.id;
        if (!acc.find(c => c.id === clientId)) {
          acc.push(message.sender);
        }
        return acc;
      }, []) || [];
      
      return uniqueClients;
    } catch (err) {
      console.error('Error getting clients with messages:', err);
      return [];
    }
  };

  // Open edit modal with current submission data
  const handleEditClick = (sub: any) => {
    setEditSubmission(sub);
    setEditTrackName(sub.track_name || '');
    setEditTrackBpm(sub.track_bpm?.toString() || '');
    setEditTrackKey(sub.track_key || '');
    setEditHasStems(!!sub.has_stems);
    setEditHasTrackouts(!!sub.has_trackouts);
    setEditError(null);
    setEditModalOpen(true);
  };

  // Save changes after confirmation
  const handleEditSave = async () => {
    if (!user) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const { error } = await supabase.from('sync_submissions').update({
        track_name: editTrackName,
        track_bpm: Number(editTrackBpm),
        track_key: editTrackKey,
        has_stems: editHasStems,
        has_trackouts: editHasTrackouts,
      }).eq('id', editSubmission.id);
      if (error) throw error;
      setEditModalOpen(false);
      setEditSubmission(null);
      setShowConfirm(false);
      // Refresh submissions
      const { data, error: fetchError } = await supabase
        .from('sync_submissions')
        .select('*')
        .eq('producer_id', user.id)
        .eq('sync_request_id', requestId)
        .order('created_at', { ascending: false });
      if (!fetchError && data) setMySubmissions(data);
    } catch (err: any) {
      setEditError(err.message || 'Update failed.');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-900 py-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="max-w-xl mx-auto bg-blue-800/80 border border-blue-500/40 rounded-xl p-8">
            <h1 className="text-2xl font-bold text-white mb-6">Submit Track for Custom Sync</h1>
            {loadingRequest ? (
              <div className="mb-4 text-blue-200">Loading request details...</div>
            ) : requestInfo ? (
              <div className="mb-6 p-4 bg-blue-950/80 border border-blue-700/40 rounded-lg">
                <div className="text-lg font-semibold text-white mb-1">{requestInfo.project_title}</div>
                <div className="text-gray-300 mb-2">{requestInfo.project_description}</div>
                <div className="flex flex-wrap gap-4 text-sm text-blue-200 mb-1">
                  <span><strong>Sync Fee:</strong> ${requestInfo.sync_fee?.toFixed(2)}</span>
                  <span><strong>End Date:</strong> {new Date(requestInfo.end_date).toLocaleDateString()}</span>
                  <span><strong>Genre:</strong> {requestInfo.genre}</span>
                  <span><strong>Sub-genres:</strong> {Array.isArray(requestInfo.sub_genres) ? requestInfo.sub_genres.join(', ') : requestInfo.sub_genres}</span>
                </div>
              </div>
            ) : requestId ? (
              <div className="mb-4 text-red-300">Custom sync request not found.</div>
            ) : null}
            {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded text-green-400">Submission successful!</div>}
            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Track Name</label>
                <input type="text" value={trackName} onChange={e => setTrackName(e.target.value)} className="w-full rounded px-3 py-2 bg-blue-900/60 text-white border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Track BPM</label>
                  <input type="number" value={trackBpm} onChange={e => setTrackBpm(e.target.value)} className="w-full rounded px-3 py-2 bg-blue-900/60 text-white border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Track Key</label>
                  <input type="text" value={trackKey} onChange={e => setTrackKey(e.target.value)} className="w-full rounded px-3 py-2 bg-blue-900/60 text-white border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">MP3 File</label>
                <input type="file" accept="audio/mp3,audio/mpeg" onChange={handleMp3Change} className="w-full" />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={hasStems} onChange={e => setHasStems(e.target.checked)} />
                  <span className="text-gray-300">Stems Available</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={hasTrackouts} onChange={e => setHasTrackouts(e.target.checked)} />
                  <span className="text-gray-300">Trackouts Available</span>
                </label>
              </div>
              <button type="submit" disabled={uploading} className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center">
                {uploading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
                {uploading ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </div>
        </div>
        {/* Active Submissions Sidebar */}
        {mySubmissions.length > 0 && (
          <div className="w-full lg:w-[25rem] flex-shrink-0">
            <div className="bg-blue-950/80 border border-blue-500/40 rounded-xl p-4 mb-8">
              <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2"><Hourglass className="w-5 h-5" /> Active Submissions</h3>
              <div className="mb-2 text-blue-200 font-semibold truncate" title={requestInfo?.project_title}>{requestInfo?.project_title || ''}</div>
              <div className="space-y-2">
                {mySubmissions.map((sub) => (
                  <div key={sub.id} className="flex flex-col bg-blue-900/80 rounded-lg p-2 mb-2 cursor-pointer hover:bg-blue-800/80" onClick={() => handleEditClick(sub)}>
                    <span className="font-semibold text-white flex items-center gap-2">
                      {sub.track_name || sub.track_url?.split('/').pop() || 'Track'}
                      {favoritedIds.has(sub.id) && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs flex items-center gap-1">
                          <Star className="w-3 h-3" fill="currentColor" /> Favorited
                        </span>
                      )}
                    </span>
                    <div className="flex gap-2 text-xs text-blue-200 mt-1">
                      <span>BPM: {sub.track_bpm || '-'}</span>
                      <span>Key: {sub.track_key || '-'}</span>
                    </div>
                    <span className="mt-1 px-2 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs flex items-center gap-1 w-max"><Hourglass className="w-3 h-3" /> In Consideration</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Chat Section */}
            <div className="bg-blue-950/80 border border-blue-500/40 rounded-xl p-4">
              <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" /> Client Messages
                {unreadCount > 0 && (
                  <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-bold animate-pulse">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              <button
                onClick={async () => {
                  const clients = await getClientsWithMessages();
                  if (clients.length > 0) {
                    handleOpenChat(clients[0].id, `${clients[0].first_name} ${clients[0].last_name}`);
                  } else {
                    alert('No client messages yet.');
                  }
                }}
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 relative"
              >
                <MessageCircle className="w-4 h-4" />
                View Messages
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 px-2 py-1 bg-red-500 text-white rounded-full text-xs font-bold animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* Chat History Preview */}
              {chatHistory.length > 0 && (
                <div className="mt-4 p-3 bg-blue-900/60 border border-blue-700/40 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-200 mb-2 flex items-center gap-2">
                    <MessageCircle className="w-3 h-3" />
                    Recent Messages ({chatHistory.length} total)
                    {unreadCount > 0 && (
                      <span className="text-red-400 text-xs">● {unreadCount} unread</span>
                    )}
                  </h4>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {chatHistory.slice(-2).map((msg) => (
                      <div key={msg.id} className="text-xs">
                        <span className="text-blue-300 font-medium">
                          {msg.sender.first_name} {msg.sender.last_name}:
                        </span>
                        <span className="text-gray-300 ml-1">
                          {msg.message.length > 30 ? `${msg.message.substring(0, 30)}...` : msg.message}
                        </span>
                        <div className="text-gray-500 text-xs">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </div>
                        {msg.recipient_id === user?.id && !msg.is_read && (
                          <span className="text-red-400 text-xs">●</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {chatHistory.length > 2 && (
                    <div className="text-xs text-blue-300 mt-1">
                      +{chatHistory.length - 2} more messages
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Edit Submission Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        {editModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-blue-900/90 rounded-xl p-8 max-w-md w-full shadow-lg">
              <h2 className="text-xl font-bold mb-4 text-white">Edit Submission</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Track Name</label>
                  <input type="text" value={editTrackName} onChange={e => setEditTrackName(e.target.value)} className="w-full rounded px-3 py-2 border border-blue-700 bg-blue-900/60 text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white mb-1">Track BPM</label>
                    <input type="number" value={editTrackBpm} onChange={e => setEditTrackBpm(e.target.value)} className="w-full rounded px-3 py-2 border border-blue-700 bg-blue-900/60 text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white mb-1">Track Key</label>
                    <input type="text" value={editTrackKey} onChange={e => setEditTrackKey(e.target.value)} className="w-full rounded px-3 py-2 border border-blue-700 bg-blue-900/60 text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={editHasStems} onChange={e => setEditHasStems(e.target.checked)} />
                    <span className="text-blue-200">Stems Available</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={editHasTrackouts} onChange={e => setEditHasTrackouts(e.target.checked)} />
                    <span className="text-blue-200">Trackouts Available</span>
                  </label>
                </div>
                {editError && <div className="text-red-400 text-sm">{editError}</div>}
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 rounded bg-blue-800 hover:bg-blue-700 text-white">Cancel</button>
                <button onClick={() => setShowConfirm(true)} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold" disabled={editLoading}>Save Changes</button>
              </div>
            </div>
          </div>
        )}
      </Dialog>
      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Confirm Changes</h2>
            <p className="mb-6 text-gray-700">Are you sure you want to save these changes to your submission?</p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Cancel</button>
              <button onClick={handleEditSave} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold" disabled={editLoading}>Yes, Save</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Chat Dialog */}
      {showChat && selectedClient && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-blue-900/90 rounded-xl max-w-2xl w-full h-[600px] flex flex-col shadow-lg">
            {/* Header */}
            <div className="p-4 border-b border-blue-700/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Chat with {selectedClient.name}
                </h3>
                <p className="text-sm text-blue-300">
                  Sync Request: {requestInfo?.project_title || 'Custom Sync'}
                </p>
              </div>
              <button
                onClick={handleCloseChat}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((message) => {
                  console.log('Producer rendering message:', message);
                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender.email === user?.email ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.sender.email === user?.email
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-800/60 text-gray-300'
                        }`}
                      >
                        <p className="text-sm font-medium mb-1">
                          {message.sender.first_name} {message.sender.last_name}
                        </p>
                        <p>{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-blue-700/40">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 bg-blue-800/60 text-white border border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim() || sendingMessage}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
                >
                  {sendingMessage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Submission Modal */}
    </div>
  );
} 