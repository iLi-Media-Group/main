import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { Star, BadgeCheck, Hourglass, MoreVertical, Send, X, CreditCard, MessageCircle, Download, CheckCircle } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';
import { ProducerProfileDialog } from './ProducerProfileDialog';
import { formatSubGenresForDisplay } from '../utils/genreUtils';

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
  payment_terms?: string;
  payment_status?: string;
  client: {
    first_name: string;
    last_name: string;
    email: string;
  };
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

export default function RightsHolderCustomSyncSubs() {
  const { user } = useUnifiedAuth();
  const [requests, setRequests] = useState<CustomSyncRequest[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, SyncSubmission[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<{ [subId: string]: SyncSubmission }>(() => ({}));
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [selectedSubmission, setSelectedSubmission] = useState<{ reqId: string; sub: SyncSubmission } | null>(null);
  const [hiddenSubmissions, setHiddenSubmissions] = useState<Record<string, Set<string>>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatHistory, setChatHistory] = useState<Record<string, any[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [showChatBox, setShowChatBox] = useState(false);
  const [selectedRequestForChat, setSelectedRequestForChat] = useState<CustomSyncRequest | null>(null);
  const [chatBoxMessage, setChatBoxMessage] = useState('');
  const [chatBoxMessages, setChatBoxMessages] = useState<any[]>([]);
  const [sendingChatBoxMessage, setSendingChatBoxMessage] = useState(false);
  const chatDialogMessagesRef = useRef<HTMLDivElement>(null);
  const chatBoxMessagesRef = useRef<HTMLDivElement>(null);
  const [showProducerProfileDialog, setShowProducerProfileDialog] = useState(false);
  const [producerProfileId, setProducerProfileId] = useState<string | null>(null);

  // Auto-scroll chat box to bottom when new messages arrive
  useEffect(() => {
    if (showChatBox && chatBoxMessagesRef.current) {
      chatBoxMessagesRef.current.scrollTop = chatBoxMessagesRef.current.scrollHeight;
    }
  }, [chatBoxMessages, showChatBox]);

  // Auto-scroll modal chat dialog to bottom when new messages arrive
  useEffect(() => {
    if (showChatDialog && chatDialogMessagesRef.current) {
      chatDialogMessagesRef.current.scrollTop = chatDialogMessagesRef.current.scrollHeight;
    }
  }, [chatMessages, showChatDialog]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (openDropdown && dropdownRefs.current[openDropdown] && !dropdownRefs.current[openDropdown]!.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openDropdown]);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // First get all sync request IDs where this rights holder has submitted tracks
      const { data: submissionRequests, error: submissionRequestsError } = await supabase
        .from('sync_submissions')
        .select('sync_request_id')
        .eq('producer_id', user.id);

      if (submissionRequestsError) throw submissionRequestsError;

      if (!submissionRequests || submissionRequests.length === 0) {
        setRequests([]);
        setSubmissions({});
        setFavoriteIds(new Set());
        return;
      }

      const requestIds = submissionRequests.map(s => s.sync_request_id);

      // Fetch custom sync requests where the rights holder has submitted tracks
      const { data: requestsData, error: requestsError } = await supabase
        .from('custom_sync_requests')
        .select(`
          *,
          client:profiles!custom_sync_requests_client_id_fkey(first_name, last_name, email)
        `)
        .in('id', requestIds)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      setRequests(requestsData || []);

      // Fetch submissions for each request
      const submissionsData: Record<string, SyncSubmission[]> = {};
      for (const request of requestsData || []) {
        const { data: subsData, error: subsError } = await supabase
          .from('sync_submissions')
          .select('*')
          .eq('sync_request_id', request.id)
          .order('created_at', { ascending: false });

        if (!subsError && subsData) {
          submissionsData[request.id] = subsData;
        }
      }

      setSubmissions(submissionsData);

      // Fetch favorites for each request based on the client who created the request
      const allFavoriteIds = new Set<string>();
      
      for (const request of requestsData || []) {
        // Get submission IDs for this specific request
        const requestSubmissionIds = submissionsData[request.id]?.map(sub => sub.id) || [];
        
        if (requestSubmissionIds.length > 0) {
          // Fetch favorites for these submissions by the client who created this request
          const { data: favoritesData, error: favoritesError } = await supabase
            .from('sync_submission_favorites')
            .select('sync_submission_id')
            .in('sync_submission_id', requestSubmissionIds)
            .eq('client_id', request.client_id);

          console.log('Request:', request.project_title);
          console.log('Client ID:', request.client_id);
          console.log('Submission IDs:', requestSubmissionIds);
          console.log('Favorites data:', favoritesData);
          console.log('Favorites error:', favoritesError);

          if (!favoritesError && favoritesData) {
            favoritesData.forEach(f => allFavoriteIds.add(f.sync_submission_id));
          }
        }
      }
      
      console.log('Final favorite IDs:', Array.from(allFavoriteIds));
      
      // Test: Fetch ALL favorites to see if the table has any data
      const { data: allFavorites, error: allFavoritesError } = await supabase
        .from('sync_submission_favorites')
        .select('*');
      console.log('ALL favorites in table:', allFavorites);
      console.log('ALL favorites error:', allFavoritesError);
      
      setFavoriteIds(allFavoriteIds);

    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load custom sync requests');
    } finally {
      setLoading(false);
    }
  };

  // Rights holders cannot favorite submissions - only clients can do that
  // This function is kept for compatibility but does nothing
  const toggleFavorite = async (submission: SyncSubmission, reqId: string) => {
    // Rights holders cannot favorite submissions
    return;
  };

  const hideSubmission = (reqId: string, subId: string) => {
    setHiddenSubmissions(prev => ({
      ...prev,
      [reqId]: new Set([...Array.from(prev[reqId] || []), subId])
    }));
  };

  const showSubmission = (reqId: string, subId: string) => {
    setHiddenSubmissions(prev => ({
      ...prev,
      [reqId]: new Set(Array.from(prev[reqId] || []).filter(id => id !== subId))
    }));
  };

  const sendMessage = async () => {
    if (!user || !selectedRequestForChat || !chatBoxMessage.trim()) return;

    try {
      setSendingChatBoxMessage(true);
      
      const { error } = await supabase
        .from('custom_sync_request_messages')
        .insert({
          sync_request_id: selectedRequestForChat.id,
          sender_id: user.id,
          message: chatBoxMessage.trim(),
          sender_type: 'rights_holder'
        });

      if (!error) {
        setChatBoxMessage('');
        // Refresh messages
        fetchChatMessages(selectedRequestForChat.id);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingChatBoxMessage(false);
    }
  };

  const fetchChatMessages = async (reqId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('custom_sync_request_messages')
        .select(`
          *,
          sender:profiles(first_name, last_name, email)
        `)
        .eq('sync_request_id', reqId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setChatBoxMessages(data);
        setChatHistory(prev => ({ ...prev, [reqId]: data }));
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  const openChat = (request: CustomSyncRequest) => {
    setSelectedRequestForChat(request);
    setShowChatBox(true);
    fetchChatMessages(request.id);
  };

  const closeChat = () => {
    setShowChatBox(false);
    setSelectedRequestForChat(null);
    setChatBoxMessages([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your custom sync request submissions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Your Custom Sync Request Submissions</h1>
          <p className="text-gray-300">View and manage your submissions to custom sync requests</p>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-xl mb-4">No custom sync request submissions found</div>
            <p className="text-gray-500">You haven't submitted any tracks to custom sync requests yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <div key={request.id} className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{request.project_title}</h2>
                    <p className="text-gray-300">{request.project_description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400 mt-2">
                      <span><strong>Client:</strong> {request.client?.first_name} {request.client?.last_name}</span>
                      <span><strong>Sync Fee:</strong> ${request.sync_fee?.toFixed(2)}</span>
                      <span><strong>End Date:</strong> {new Date(request.end_date).toLocaleDateString()}</span>
                      <span><strong>Genre:</strong> {request.genre}</span>
                      <span><strong>Sub-genres:</strong> {formatSubGenresForDisplay(request.sub_genres)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => openChat(request)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat with Client
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Your Submissions</h3>
                  {submissions[request.id]?.filter(sub => sub.producer_id === user?.id).length === 0 ? (
                    <div className="text-gray-400 text-center py-4">No submissions found for this request.</div>
                  ) : (
                    submissions[request.id]
                      ?.filter(sub => sub.producer_id === user?.id)
                      .map((submission) => (
                        <div key={submission.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-white font-semibold">
                                {submission.track_name || 'Untitled Track'}
                              </h4>
                              {submission.track_bpm && (
                                <span className="text-gray-400 text-sm">BPM: {submission.track_bpm}</span>
                              )}
                              {submission.track_key && (
                                <span className="text-gray-400 text-sm">Key: {submission.track_key}</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleFavorite(submission, request.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  favoriteIds.has(submission.id)
                                    ? 'text-yellow-400 bg-yellow-400/20'
                                    : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/20'
                                }`}
                              >
                                <Star className="w-5 h-5" fill={favoriteIds.has(submission.id) ? 'currentColor' : 'none'} />
                              </button>
                            </div>
                          </div>

                          {submission.track_url && (
                            <div className="mb-3">
                              <AudioPlayer audioUrl={submission.track_url} />
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 text-sm">
                            {submission.has_mp3 && (
                              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">MP3</span>
                            )}
                            {submission.has_stems && (
                              <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Stems</span>
                            )}
                            {submission.has_trackouts && (
                              <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Trackouts</span>
                            )}
                            {favoriteIds.has(submission.id) && (
                              <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded flex items-center gap-1">
                                <Hourglass className="w-3 h-3" /> In Consideration
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-gray-400 mt-2">
                            Submitted: {new Date(submission.created_at || '').toLocaleDateString()}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chat Box */}
        {showChatBox && selectedRequestForChat && (
          <div className="fixed bottom-4 right-4 w-80 h-96 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-white/20">
              <h3 className="text-white font-semibold">Chat with Client</h3>
              <button onClick={closeChat} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div ref={chatBoxMessagesRef} className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatBoxMessages.map((message, index) => (
                <div key={index} className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs p-2 rounded-lg ${
                    message.sender_id === user?.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-white'
                  }`}>
                    <div className="text-xs text-gray-300 mb-1">
                      {message.sender?.first_name} {message.sender?.last_name}
                    </div>
                    <div>{message.message}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-3 border-t border-white/20">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatBoxMessage}
                  onChange={(e) => setChatBoxMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/10 text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={sendingChatBoxMessage || !chatBoxMessage.trim()}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Producer Profile Dialog */}
        {showProducerProfileDialog && producerProfileId && (
          <ProducerProfileDialog
            producerId={producerProfileId}
            onClose={() => {
              setShowProducerProfileDialog(false);
              setProducerProfileId(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
