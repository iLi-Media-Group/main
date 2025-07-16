import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Star, BadgeCheck, Hourglass, MoreVertical, Send, X, CreditCard } from 'lucide-react';
import { useRef } from 'react';

interface CustomSyncRequest {
  id: string;
  project_title: string;
  project_description: string;
  sync_fee: number;
  end_date: string;
  genre: string;
  sub_genres: string[];
  status: string;
  created_at: string;
}

interface SyncSubmission {
  id: string;
  track_url?: string;
  has_mp3?: boolean;
  has_stems?: boolean;
  has_trackouts?: boolean;
  created_at?: string;
  signed_mp3_url?: string;
  producer_id?: string;
  producer_name?: string;
  producer_number?: string;
  track_name?: string;
  track_bpm?: string;
  track_key?: string;
}

export default function CustomSyncRequestSubs() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CustomSyncRequest[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, SyncSubmission[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmSelect, setConfirmSelect] = useState<{ reqId: string; subId: string } | null>(null);
  const [favorites, setFavorites] = useState<{ [subId: string]: SyncSubmission }>(() => ({}));
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [selectedSubmission, setSelectedSubmission] = useState<{ reqId: string; sub: SyncSubmission } | null>(null);
  const [hiddenSubmissions, setHiddenSubmissions] = useState<Record<string, Set<string>>>({});
  // Track selected submission per request
  const [selectedPerRequest, setSelectedPerRequest] = useState<Record<string, string | null>>({});
  // Payment status per request
  const [paidRequests, setPaidRequests] = useState<Record<string, boolean>>({});
  const [processingPayment, setProcessingPayment] = useState<Record<string, boolean>>({});
  // Add dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // Add chat dialog state
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (openDropdown && dropdownRefs.current[openDropdown]) {
        if (!dropdownRefs.current[openDropdown]?.contains(e.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openDropdown]);

  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('custom_sync_requests')
        .select('*, sync_submissions(*)')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      if (error) setError(error.message);
      else {
        setRequests(data || []);
        // Map submissions by request id and fetch signed URLs for mp3s and producer info
        const subMap: Record<string, SyncSubmission[]> = {};
        for (const req of data || []) {
          const subs: SyncSubmission[] = req.sync_submissions || [];
          const updatedSubs = await Promise.all(subs.map(async (sub: SyncSubmission) => {
            let producer_name = 'Unknown Producer';
            let producer_number = '';
            if (sub.producer_id) {
              const { data: producerProfile } = await supabase
                .from('profiles')
                .select('first_name, last_name, producer_number')
                .eq('id', sub.producer_id)
                .maybeSingle();
              if (producerProfile) {
                producer_name = `${producerProfile.first_name || ''} ${producerProfile.last_name || ''}`.trim() || 'Unknown Producer';
                producer_number = producerProfile.producer_number || '';
              }
            }
            // Update signed URL logic to use track_url instead of mp3_url
            if (sub.has_mp3 && sub.track_url) {
              const match = sub.track_url.match(/sync-submissions\/(.+)$/);
              const filePath = match ? `sync-submissions/${match[1]}` : undefined;
              if (filePath) {
                const { data: signedUrlData } = await supabase.storage
                  .from('sync-submissions')
                  .createSignedUrl(filePath.replace('sync-submissions/', ''), 3600);
                if (signedUrlData?.signedUrl) {
                  return { ...sub, signed_mp3_url: signedUrlData.signedUrl, producer_name, producer_number };
                }
              }
            }
            return { ...sub, producer_name, producer_number };
          }));
          subMap[req.id] = updatedSubs;
        }
        setSubmissions(subMap);
        // Fetch favorites from DB
        const { data: favs } = await supabase
          .from('sync_submission_favorites')
          .select('sync_submission_id')
          .eq('client_id', user.id);
        setFavoriteIds(new Set((favs || []).map((f: any) => f.sync_submission_id)));
        
        // Check payment status for each request
        await checkPaymentStatus(data || []);
      }
      setLoading(false);
    };
    fetchRequests();
  }, [user]);

  // Check payment status for requests
  const checkPaymentStatus = async (requestsData: CustomSyncRequest[]) => {
    const paidStatus: Record<string, boolean> = {};
    
    for (const req of requestsData) {
      // Check if there's a successful payment for this request
      const { data: payments } = await supabase
        .from('payments')
        .select('status')
        .eq('sync_request_id', req.id)
        .eq('status', 'succeeded')
        .maybeSingle();
      
      paidStatus[req.id] = !!payments;
    }
    
    setPaidRequests(paidStatus);
  };

  // Persist favorite/unfavorite in DB and re-fetch after DB operation
  const handleFavorite = async (sub: SyncSubmission) => {
    if (!user) return;
    // Optimistically update local state
    setFavoriteIds(prev => {
      const copy = new Set(prev);
      if (copy.has(sub.id)) {
        copy.delete(sub.id);
      } else {
        copy.add(sub.id);
      }
      return copy;
    });
    // Update DB
    const isNowFavorite = favoriteIds.has(sub.id);
    if (isNowFavorite) {
      await supabase
        .from('sync_submission_favorites')
        .delete()
        .eq('client_id', user.id)
        .eq('sync_submission_id', sub.id);
    } else {
      await supabase
        .from('sync_submission_favorites')
        .insert({ client_id: user.id, sync_submission_id: sub.id });
    }
    // After a short delay, re-fetch favorites to confirm
    setTimeout(async () => {
      const { data: favs } = await supabase
        .from('sync_submission_favorites')
        .select('sync_submission_id')
        .eq('client_id', user.id);
      setFavoriteIds(new Set((favs || []).map((f: any) => f.sync_submission_id)));
    }, 200);
  };

  const handleSelect = (reqId: string, subId: string) => {
    setConfirmSelect({ reqId, subId });
  };

  const confirmSelectSubmission = async () => {
    if (!confirmSelect) return;
    const { reqId, subId } = confirmSelect;
    const sub = submissions[reqId]?.find(s => s.id === subId);
    setSelectedSubmission(sub ? { reqId, sub } : null);
    setSelectedPerRequest(prev => ({ ...prev, [reqId]: subId }));
    setConfirmSelect(null);
    alert('Track selected! All other submissions will be declined.');
  };

  // Handle Stripe payment for selected submission
  const handlePayment = async (reqId: string) => {
    if (!user || !selectedPerRequest[reqId]) return;
    
    const selectedSub = submissions[reqId]?.find(s => s.id === selectedPerRequest[reqId]);
    const request = requests.find(r => r.id === reqId);
    
    if (!selectedSub || !request) return;
    
    setProcessingPayment(prev => ({ ...prev, [reqId]: true }));
    
    try {
      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          price_id: 'price_custom',
          custom_amount: Math.round(request.sync_fee * 100), // Convert to cents
          mode: 'payment',
          success_url: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/custom-sync-requests`,
          metadata: {
            sync_request_id: reqId,
            sync_submission_id: selectedSub.id,
            producer_id: selectedSub.producer_id,
            client_id: user.id,
            type: 'sync_payment',
            description: `Sync License - ${request.project_title} - ${selectedSub.track_name || 'Untitled'}`
          }
        }
      });
      
      if (error) throw error;
      
      // Redirect to Stripe checkout
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessingPayment(prev => ({ ...prev, [reqId]: false }));
    }
  };

  const cancelSelect = () => setConfirmSelect(null);

  // Hide all non-favorited submissions for a request
  const handleDeleteAllExceptFavorites = (reqId: string) => {
    setHiddenSubmissions((prev) => {
      const favIds = new Set(Object.keys(favorites));
      const allSubIds = (submissions[reqId] || []).map(s => s.id);
      const toHide = allSubIds.filter(id => !favIds.has(id));
      return { ...prev, [reqId]: new Set(toHide) };
    });
  };

  // De-select the chosen submission
  const handleDeselect = () => {
    if (!selectedSubmission) return;
    
    // Clear the selection for this specific request
    setSelectedPerRequest(prev => ({ ...prev, [selectedSubmission.reqId]: null }));
    setSelectedSubmission(null);
  };

  // Open chat dialog with producer
  const handleMessageProducer = async () => {
    if (!selectedSubmission || !user) return;
    setShowChatDialog(true);
    // Fetch existing chat messages for this producer
    await fetchChatMessages();
  };

  // Fetch chat messages with the producer
  const fetchChatMessages = async () => {
    if (!selectedSubmission || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
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
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${selectedSubmission.sub.producer_id}),and(sender_id.eq.${selectedSubmission.sub.producer_id},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setChatMessages(data || []);
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  // Send a message to the producer
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission || !user || !chatMessage.trim()) return;
    
    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedSubmission.sub.producer_id,
          message: chatMessage.trim(),
          room_id: null // Direct message
        });
      
      if (error) throw error;
      
      setChatMessage('');
      // Refresh messages
      await fetchChatMessages();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-900 py-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-6">Your Custom Sync Request Submissions</h1>
          {loading ? (
            <div className="text-center text-blue-300">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-400">{error}</div>
          ) : requests.length === 0 ? (
            <div className="text-center text-gray-400">You have not submitted any custom sync requests yet.</div>
          ) : (
            <div className="space-y-6">
              {requests.map((req) => (
                <div key={req.id} className="bg-blue-800/80 border border-blue-500/40 rounded-xl p-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
                    <h2 className="text-xl font-semibold text-white mb-2 md:mb-0">{req.project_title}</h2>
                  </div>
                  <p className="text-gray-300 mb-2">{req.project_description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-2">
                    <span><strong>Sync Fee:</strong> ${req.sync_fee.toFixed(2)}</span>
                    <span><strong>End Date:</strong> {new Date(req.end_date).toLocaleDateString()}</span>
                    <span><strong>Genre:</strong> {req.genre}</span>
                    <span><strong>Sub-genres:</strong> {Array.isArray(req.sub_genres) ? req.sub_genres.join(', ') : req.sub_genres}</span>
                  </div>
                  {/* Delete all except favorites button */}
                  <div className="flex justify-end mb-2">
                    <button
                      className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                      onClick={() => handleDeleteAllExceptFavorites(req.id)}
                      disabled={Object.keys(favorites).length === 0}
                    >
                      Delete all except Favorites
                    </button>
                  </div>
                  {paidRequests[req.id] && (
                    <div className="mb-2 flex justify-end">
                      <span className="px-3 py-1 bg-green-700 text-white rounded-full text-sm flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4" /> Paid - Unselected submissions deleted
                      </span>
                    </div>
                  )}
                  {submissions[req.id] && submissions[req.id].length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-blue-200 mb-4">Producer Submissions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-1 gap-6">
                        {submissions[req.id]
                          .filter(sub => !hiddenSubmissions[req.id]?.has(sub.id))
                          .map((sub) => (
                            <div
                              key={sub.id}
                              className={`relative bg-blue-950/80 border border-blue-700/40 rounded-2xl shadow-lg p-5 flex flex-col min-h-[170px] max-w-4xl w-full mx-auto transition-transform hover:-translate-y-1 hover:shadow-2xl ${selectedPerRequest[req.id] === sub.id ? 'ring-2 ring-green-400' : ''}`}
                            >
                              {/* Top Row: Producer info and actions */}
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <span className="font-semibold text-white text-base">{sub.producer_name}</span>
                                  {sub.producer_number && (
                                    <span className="ml-2 text-xs text-blue-300">({sub.producer_number})</span>
                                  )}
                                  {favoriteIds.has(sub.id) && (
                                    <span className="ml-2 flex items-center px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                                      <Star className="w-4 h-4 mr-1 fill-yellow-400" /> Favorited
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="relative" ref={el => (dropdownRefs.current[sub.id] = el)}>
                                    <button
                                      className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-sm flex items-center gap-1"
                                      onClick={() => setOpenDropdown(openDropdown === sub.id ? null : sub.id)}
                                    >
                                      Actions <MoreVertical className="w-4 h-4" />
                                    </button>
                                    {openDropdown === sub.id && (
                                      <div className="absolute right-0 mt-2 w-40 bg-blue-950/90 border border-blue-700 rounded shadow-lg z-50">
                                        <button
                                          className="w-full text-left px-4 py-2 hover:bg-blue-800 text-white text-sm"
                                          onClick={() => { handleFavorite(sub); setOpenDropdown(null); }}
                                        >
                                          {favoriteIds.has(sub.id) ? 'Remove Favorite' : 'Set as Favorite'}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow transition-colors disabled:opacity-50"
                                    onClick={() => handleSelect(req.id, sub.id)}
                                    disabled={!!selectedPerRequest[req.id]}
                                  >
                                    Select
                                  </button>
                                </div>
                              </div>
                              {/* Audio Player */}
                              <div className="flex-1 flex flex-col justify-center items-center my-4">
                                {/* Track Info */}
                                <div className="mb-2 flex gap-4 text-sm text-blue-200">
                                  <span><strong>Name:</strong> {sub.track_name || sub.track_url?.split('/').pop() || '-'}</span>
                                  <span><strong>BPM:</strong> {sub.track_bpm || '-'}</span>
                                  <span><strong>Key:</strong> {sub.track_key || '-'}</span>
                                </div>
                                {sub.has_mp3 && sub.signed_mp3_url ? (
                                  <audio controls src={sub.signed_mp3_url} className="w-full max-w-sm" />
                                ) : (
                                  <span className="text-gray-400">No mp3 uploaded</span>
                                )}
                              </div>
                              {/* Badges */}
                              <div className="flex gap-3 mb-2">
                                <span className={
                                  'px-2 py-1 rounded-full text-xs font-medium ' +
                                  (sub.has_stems ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/40 text-gray-400')
                                }>
                                  {sub.has_stems ? '✓ Stems' : '✗ Stems'}
                                </span>
                                <span className={
                                  'px-2 py-1 rounded-full text-xs font-medium ' +
                                  (sub.has_trackouts ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/40 text-gray-400')
                                }>
                                  {sub.has_trackouts ? '✓ Trackouts' : '✗ Trackouts'}
                                </span>
                              </div>
                              {/* Submission Date/Time */}
                              <div className="absolute bottom-4 right-7 text-xs text-gray-400">
                                {sub.created_at ? new Date(sub.created_at).toLocaleString() : ''}
                              </div>
                            </div>
                          ))}
                      </div>
                      {/* Mark as Paid button for demo/testing (replace with real payment logic) */}
                      {!paidRequests[req.id] && selectedPerRequest[req.id] && (
                        <div className="mt-4 flex justify-end">
                          <button
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow"
                            onClick={() => handlePayment(req.id)}
                            disabled={processingPayment[req.id]}
                          >
                            {processingPayment[req.id] ? (
                              <Hourglass className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <CreditCard className="w-4 h-4 mr-2" />
                            )}
                            {processingPayment[req.id] ? 'Processing Payment...' : 'Pay with Stripe'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Message Producer and De-select Buttons */}
                  {selectedSubmission && selectedSubmission.reqId === req.id && (
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow"
                        onClick={handleMessageProducer}
                      >
                        Message Producer
                      </button>
                      <button
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold shadow"
                        onClick={handleDeselect}
                      >
                        De-select
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Chat Dialog */}
      {showChatDialog && selectedSubmission && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-blue-900/90 rounded-xl max-w-2xl w-full h-[600px] flex flex-col shadow-lg">
            {/* Header */}
            <div className="p-4 border-b border-blue-700/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Chat with {selectedSubmission.sub.producer_name}
                </h3>
                <p className="text-sm text-blue-300">
                  Track: {selectedSubmission.sub.track_name || 'Untitled'}
                </p>
              </div>
              <button
                onClick={() => setShowChatDialog(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((message) => (
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
                ))
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
      {/* Confirmation Dialog */}
      {confirmSelect && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Confirm Selection</h2>
            <p className="mb-6 text-gray-700">Selecting this track will decline all other submissions for this request. Are you sure you want to proceed?</p>
            <div className="flex justify-end gap-4">
              <button onClick={cancelSelect} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Cancel</button>
              <button onClick={confirmSelectSubmission} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold">Yes, Select</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 