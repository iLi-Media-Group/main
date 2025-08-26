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
  payment_status?: string; // Added payment_status
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
  const { user } = useUnifiedAuth();
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
  const [chatHistory, setChatHistory] = useState<Record<string, any[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  // Add persistent chat box state
  const [showChatBox, setShowChatBox] = useState(false);
  const [selectedRequestForChat, setSelectedRequestForChat] = useState<CustomSyncRequest | null>(null);
  const [chatBoxMessage, setChatBoxMessage] = useState('');
  const [chatBoxMessages, setChatBoxMessages] = useState<any[]>([]);
  const [sendingChatBoxMessage, setSendingChatBoxMessage] = useState(false);
  const chatDialogMessagesRef = useRef<HTMLDivElement>(null);
  const chatBoxMessagesRef = useRef<HTMLDivElement>(null);
  const [showProducerProfileDialog, setShowProducerProfileDialog] = useState(false);
  const [producerProfileId, setProducerProfileId] = useState<string | null>(null);
  // Add a pendingChatOpen state
  const [pendingChatOpen, setPendingChatOpen] = useState(false);
  // Add a dummy state to force re-render
  const [chatRerender, setChatRerender] = useState(0);

  // --- Persistent notification logic ---
  const getLastViewed = (reqId: string) => localStorage.getItem(`cust_sync_last_viewed_${reqId}`);
  const setLastViewed = (reqId: string, timestamp: string) => localStorage.setItem(`cust_sync_last_viewed_${reqId}`, timestamp);

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
  }, [chatMessages, showChatDialog, chatRerender]);

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

  // Load chat history and unread counts for all sync requests
  useEffect(() => {
    if (!user || requests.length === 0) return;
    
    const loadAllChatHistory = async () => {
      const history: Record<string, any[]> = {};
      const unread: Record<string, number> = {};
      
      for (const req of requests) {
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
            .eq('sync_request_id', req.id)
            .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
            .order('created_at', { ascending: true });
          
          if (!error && data) {
            history[req.id] = data;
            // Count unread messages based on last viewed timestamp
            const lastViewed = getLastViewed(req.id);
            const unreadCount = data.filter(msg => 
              msg.recipient_id === user.id && 
              (!lastViewed || new Date(msg.created_at) > new Date(lastViewed))
            ).length;
            unread[req.id] = unreadCount;
          }
        } catch (err) {
          console.error(`Error loading chat history for request ${req.id}:`, err);
        }
      }
      
      setChatHistory(history);
      setUnreadCounts(unread);
    };
    
    loadAllChatHistory();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('cust_sync_chat_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'cust_sync_chat',
          filter: `or(sender_id=eq.${user.id},recipient_id=eq.${user.id})`
        }, 
        (payload) => {
          const newMessage = payload.new as any;
          // If chat dialog is open and this message is for the current chat, append it
          if (
            showChatDialog &&
            selectedSubmission &&
            newMessage.sync_request_id === selectedSubmission.reqId &&
            (newMessage.sender_id === selectedSubmission.sub.producer_id || newMessage.recipient_id === selectedSubmission.sub.producer_id || newMessage.sender_id === user.id || newMessage.recipient_id === user.id)
          ) {
            setChatMessages((prev) => {
              if (prev.some(msg => msg.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
            setChatRerender((r) => r + 1); // Force re-render
          } else {
            setChatRerender((r) => r + 1); // Force re-render for other chats
          }
          // Update unread count for the specific request
          setUnreadCounts(prev => ({
            ...prev,
            [newMessage.sync_request_id]: (prev[newMessage.sync_request_id] || 0) + (newMessage.recipient_id === user.id ? 1 : 0)
          }));
          // Reload chat history for sidebar, etc.
          loadAllChatHistory();
          // If chat box is open for this request, refresh its messages
          if (selectedRequestForChat && selectedRequestForChat.id === newMessage.sync_request_id) {
            fetchChatBoxMessages(newMessage.sync_request_id);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, requests, showChatDialog, selectedSubmission, selectedRequestForChat]);

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
      console.log('Fetched custom_sync_requests:', data);
      console.log('Custom sync requests error:', error);
      if (error) setError(error.message);
      else {
        setRequests(data || []);
        // Map submissions by request id and fetch signed URLs for mp3s and producer info
        const subMap: Record<string, SyncSubmission[]> = {};
        for (const req of data || []) {
          const subs: SyncSubmission[] = req.sync_submissions || [];
          console.log('Submissions for request', req.id, subs);
          const updatedSubs = await Promise.all(subs.map(async (sub: SyncSubmission) => {
            let producer_name = 'Unknown Producer';
            let producer_number = '';
            if (sub.producer_id) {
              try {
                const { data: producerProfile, error: profileError } = await supabase
                  .from('profiles')
                  .select('first_name, last_name, producer_number')
                  .eq('id', sub.producer_id)
                  .single();
                
                if (producerProfile && !profileError) {
                  producer_name = `${producerProfile.first_name || ''} ${producerProfile.last_name || ''}`.trim() || 'Unknown Producer';
                  producer_number = producerProfile.producer_number || '';
                }
              } catch (err) {
                console.error('Error fetching producer profile:', err);
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
        try {
          const { data: favs, error: favsError } = await supabase
            .from('sync_submission_favorites')
            .select('sync_submission_id')
            .eq('client_id', user.id);
          
          if (favsError) {
            console.error('Error fetching favorites:', favsError);
          } else {
            setFavoriteIds(new Set((favs || []).map((f: any) => f.sync_submission_id)));
          }
        } catch (err) {
          console.error('Error in favorites fetch:', err);
        }
        
        // Load persistent track selections from database
        const { data: selections } = await supabase
          .from('sync_request_selections')
          .select('sync_request_id, selected_submission_id')
          .eq('client_id', user.id);
        
        if (selections) {
          const selectionMap: Record<string, string> = {};
          selections.forEach((sel: any) => {
            selectionMap[sel.sync_request_id] = sel.selected_submission_id;
          });
          setSelectedPerRequest(selectionMap);
        }
        
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
    
    const isCurrentlyFavorite = favoriteIds.has(sub.id);
    
    try {
      if (isCurrentlyFavorite) {
        // Remove from favorites
        const { error: deleteError } = await supabase
          .from('sync_submission_favorites')
          .delete()
          .eq('client_id', user.id)
          .eq('sync_submission_id', sub.id);
        
        if (deleteError) {
          console.error('Error removing favorite:', deleteError);
          return;
        }
        
        setFavoriteIds(prev => {
          const copy = new Set(prev);
          copy.delete(sub.id);
          return copy;
        });
      } else {
        // Add to favorites
        const { error: insertError } = await supabase
          .from('sync_submission_favorites')
          .insert({ client_id: user.id, sync_submission_id: sub.id });
        
        if (insertError) {
          console.error('Error adding favorite:', insertError);
          return;
        }
        
        setFavoriteIds(prev => {
          const copy = new Set(prev);
          copy.add(sub.id);
          return copy;
        });
      }
    } catch (err) {
      console.error('Error in handleFavorite:', err);
    }
  };

  const handleSelect = (reqId: string, subId: string) => {
    setConfirmSelect({ reqId, subId });
  };

  const confirmSelectSubmission = async () => {
    if (!confirmSelect || !user) return;
    const { reqId, subId } = confirmSelect;
    const sub = submissions[reqId]?.find(s => s.id === subId);
    setSelectedSubmission(sub ? { reqId, sub } : null);
    setSelectedPerRequest(prev => ({ ...prev, [reqId]: subId }));
    
    // Persist selection to database
    try {
      const { error } = await supabase
        .from('sync_request_selections')
        .upsert({
          client_id: user.id,
          sync_request_id: reqId,
          selected_submission_id: subId
        }, {
          onConflict: 'client_id,sync_request_id'
        });
      
      if (error) {
        console.error('Error persisting selection:', error);
      }
    } catch (err) {
      console.error('Error persisting selection:', err);
    }
    
    setConfirmSelect(null);
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
          success_url: `${window.location.origin}/custom-sync-request-subs?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/dashboard`,
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
      const favIds = new Set(Array.from(favoriteIds));
      const allSubIds = (submissions[reqId] || []).map(s => s.id);
      const toHide = allSubIds.filter(id => !favIds.has(id));
      return { ...prev, [reqId]: new Set(toHide) };
    });
  };

  // De-select the chosen submission
  const handleDeselect = async () => {
    if (!selectedSubmission || !user) return;
    
    // Clear the selection for this specific request
    setSelectedPerRequest(prev => ({ ...prev, [selectedSubmission.reqId]: null }));
    setSelectedSubmission(null);
    
    // Remove selection from database
    try {
      const { error } = await supabase
        .from('sync_request_selections')
        .delete()
        .eq('client_id', user.id)
        .eq('sync_request_id', selectedSubmission.reqId);
      
      if (error) {
        console.error('Error removing selection:', error);
      }
    } catch (err) {
      console.error('Error removing selection:', err);
    }
  };

  // Open chat dialog with producer
  const handleMessageProducer = async () => {
    if (!selectedSubmission || !user) return;
    setShowChatDialog(true);
    // Fetch existing chat messages for this producer
    await fetchChatMessages();
    
    // Mark messages as read when opening chat dialog
    try {
      const { error } = await supabase
        .from('cust_sync_chat')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('sync_request_id', selectedSubmission.reqId)
        .eq('is_read', false);
      
      if (!error) {
        // Reset unread count for this request
        setUnreadCounts(prev => ({
          ...prev,
          [selectedSubmission.reqId]: 0
        }));
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
          .eq('sync_request_id', selectedSubmission.reqId)
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: true });
        
        if (!reloadError && data) {
          setChatHistory(prev => ({
            ...prev,
            [selectedSubmission.reqId]: data
          }));
        }
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Fetch chat messages with the producer
  const fetchChatMessages = async () => {
    if (!selectedSubmission || !user) return;
    
    console.log('Fetching chat messages for:', {
      user_id: user.id,
      producer_id: selectedSubmission.sub.producer_id,
      sync_request_id: selectedSubmission.reqId
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
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${selectedSubmission.sub.producer_id}),and(sender_id.eq.${selectedSubmission.sub.producer_id},recipient_id.eq.${user.id})`)
        .eq('sync_request_id', selectedSubmission.reqId)
        .order('created_at', { ascending: true });
      
      console.log('Fetched chat messages:', { data, error });
      
      if (error) throw error;
      setChatMessages(data || []);
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  // Send a message to the producer
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission || !user || !chatMessage.trim()) {
      console.log('Send message validation failed:', {
        hasSelectedSubmission: !!selectedSubmission,
        hasUser: !!user,
        hasMessage: !!chatMessage.trim(),
        selectedSubmission,
        user,
        chatMessage
      });
      return;
    }
    
    console.log('Sending message:', {
      sender_id: user.id,
      recipient_id: selectedSubmission.sub.producer_id,
      sync_request_id: selectedSubmission.reqId,
      message: chatMessage.trim()
    });
    
    setSendingMessage(true);
    try {
      // First, let's check if the cust_sync_chat table exists and we have access
      const { data: tableCheck, error: tableError } = await supabase
        .from('cust_sync_chat')
        .select('id')
        .limit(1);
      
      console.log('Table access check:', { tableCheck, tableError });
      
      if (tableError) {
        console.error('Cannot access cust_sync_chat table:', tableError);
        alert('Chat system is not available. Please contact support.');
        return;
      }
      
      const { data, error } = await supabase
        .from('cust_sync_chat')
        .insert({
          sender_id: user.id,
          recipient_id: selectedSubmission.sub.producer_id,
          sync_request_id: selectedSubmission.reqId,
          message: chatMessage.trim(),
          room_id: null // Direct message
        })
        .select();
      
      console.log('Message insert result:', { data, error });
      
      if (error) {
        console.error('Failed to insert message:', error);
        alert(`Failed to send message: ${error.message}`);
        throw error;
      }
      
      console.log('Message sent successfully:', data);
      setChatMessage('');
      // Refresh messages
      await fetchChatMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Open chat box for a specific request
  const openChatBox = async (request: CustomSyncRequest) => {
    if (!user) return;
    
    setSelectedRequestForChat(request);
    setShowChatBox(true);
    await fetchChatBoxMessages(request.id);
    
    // Mark messages as read when opening chat box
    try {
      const { error } = await supabase
        .from('cust_sync_chat')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('sync_request_id', request.id)
        .eq('is_read', false);
      
      if (!error) {
        // Reset unread count for this request
        setUnreadCounts(prev => ({
          ...prev,
          [request.id]: 0
        }));
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
          .eq('sync_request_id', request.id)
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: true });
        
        if (!reloadError && data) {
          setChatHistory(prev => ({
            ...prev,
            [request.id]: data
          }));
          // Set last viewed timestamp to latest message
          if (data.length > 0) {
            setLastViewed(request.id, data[data.length - 1].created_at);
          }
        }
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Fetch chat messages for the chat box
  const fetchChatBoxMessages = async (requestId: string) => {
    if (!user) return;
    
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
      
      if (error) throw error;
      setChatBoxMessages(data || []);
    } catch (err) {
      console.error('Error fetching chat box messages:', err);
    }
  };

  // Send message from chat box
  const handleSendChatBoxMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForChat || !user || !chatBoxMessage.trim()) return;
    
    setSendingChatBoxMessage(true);
    try {
      // Find the first producer for this request to send message to
      const requestSubmissions = submissions[selectedRequestForChat.id] || [];
      if (requestSubmissions.length === 0) {
        alert('No producers found for this request.');
        return;
      }
      
      const firstProducer = requestSubmissions[0];
      
      const { data, error } = await supabase
        .from('cust_sync_chat')
        .insert({
          sender_id: user.id,
          recipient_id: firstProducer.producer_id,
          sync_request_id: selectedRequestForChat.id,
          message: chatBoxMessage.trim(),
          room_id: null
        })
        .select();
      
      if (error) throw error;
      
      setChatBoxMessage('');
      await fetchChatBoxMessages(selectedRequestForChat.id);
    } catch (err) {
      console.error('Error sending chat box message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingChatBoxMessage(false);
    }
  };

  // Close chat box
  const handleCloseChatBox = () => {
    setShowChatBox(false);
    setSelectedRequestForChat(null);
    setChatBoxMessages([]);
    setChatBoxMessage('');
  };

  // Helper function to calculate payment due date based on payment terms
  const calculatePaymentDueDate = (paymentTerms: string | undefined): Date => {
    const today = new Date();
    switch (paymentTerms) {
      case 'immediate':
        return today;
      case 'net30':
        return new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      case 'net60':
        return new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
      case 'net90':
        return new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // Default to net30
    }
  };

  // Helper function to format payment terms for display
  const formatPaymentTerms = (paymentTerms: string | undefined): string => {
    switch (paymentTerms) {
      case 'immediate':
        return 'Immediate';
      case 'net30':
        return 'Net 30';
      case 'net60':
        return 'Net 60';
      case 'net90':
        return 'Net 90';
      default:
        return 'Net 30'; // Default
    }
  };

  // Download function for sync request files
  const handleDownloadSyncRequest = async (bucket: string, path: string, filename: string) => {
    try {
      // First check if the file exists
      const { data: fileExists, error: checkError } = await supabase.storage
        .from(bucket)
        .list(path.split('/').slice(0, -1).join('/'), {
          search: path.split('/').pop()
        });
      
      if (checkError || !fileExists || fileExists.length === 0) {
        alert('File not found. The producer may not have uploaded this file yet.');
        return;
      }
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600);
      
      if (error) {
        console.error('Error creating signed URL:', error);
        alert('Failed to download file. Please try again.');
        return;
      }
      
      if (data?.signedUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = filename;
        link.target = '_blank'; // This ensures it downloads instead of opening
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download file. Please try again.');
    }
  };

  useEffect(() => {
    if (pendingChatOpen && selectedSubmission) {
      handleMessageProducer();
      setPendingChatOpen(false);
    }
  }, [pendingChatOpen, selectedSubmission]);

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
                    <div className="relative flex items-center gap-2">
                      {/* New Message Envelope Icon (outside chat button, never blocks clicks) */}
                      {unreadCounts[req.id] > 0 && (
                        <img
                          src="/icons/new-message.png"
                          alt="New message"
                          className="absolute -top-4 -right-10 w-8 h-8 z-20 pointer-events-none animate-bounce"
                          style={{ filter: 'drop-shadow(0 0 6px #0f0)' }}
                        />
                      )}
                    </div>
                  </div>
                  <p className="text-gray-300 mb-2">{req.project_description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-2">
                    <span><strong>Sync Fee:</strong> ${req.sync_fee.toFixed(2)}</span>
                    <span><strong>End Date:</strong> {new Date(req.end_date).toLocaleDateString()}</span>
                    <span><strong>Genre:</strong> {req.genre}</span>
                    <span><strong>Sub-genres:</strong> {formatSubGenresForDisplay(req.sub_genres)}</span>
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
                  {req.payment_status === 'paid' && (
                    <div className="mb-2 flex justify-end">
                      <span className="px-3 py-1 bg-green-700 text-white rounded-full text-sm flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4" /> Paid
                      </span>
                    </div>
                  )}
                  
                  {/* Download buttons for paid requests */}
                  {req.payment_status === 'paid' && (
                    <div className="mb-4 flex flex-wrap gap-2 justify-end">
                      {/* Find the selected submission for this request */}
                      {(() => {
                        const selectedSubId = selectedPerRequest[req.id];
                        const selectedSub = submissions[req.id]?.find(sub => sub.id === selectedSubId);
                        
                        if (!selectedSub) return null;
                        
                        return (
                          <>
                            {/* MP3 Download - Always available if track_url exists */}
                            {selectedSub.track_url && (
                              <button
                                onClick={() => {
                                  const match = selectedSub.track_url?.match(/sync-submissions\/(.+)$/);
                                  const filePath = match ? match[1] : (selectedSub.track_url || '');
                                  handleDownloadSyncRequest('sync-submissions', filePath, `${selectedSub.track_name || 'Track'}_MP3.mp3`);
                                }}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center gap-2"
                                title="Download MP3"
                              >
                                <Download className="w-3 h-3" />
                                Download MP3
                              </button>
                            )}
                            
                            {/* Trackouts Download - Only show if producer indicated they have trackouts */}
                            {selectedSub.has_trackouts && selectedSub.track_url && (
                              <button
                                onClick={() => {
                                  const match = selectedSub.track_url?.match(/sync-submissions\/(.+)$/);
                                  const filePath = match ? match[1].replace('.mp3', '_trackouts.zip') : (selectedSub.track_url?.replace('.mp3', '_trackouts.zip') || '');
                                  handleDownloadSyncRequest('sync-submissions', filePath, `${selectedSub.track_name || 'Track'}_Trackouts.zip`);
                                }}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-2"
                                title="Download Trackouts"
                              >
                                <Download className="w-3 h-3" />
                                Download Trackouts
                              </button>
                            )}
                            
                            {/* Stems Download - Only show if producer indicated they have stems */}
                            {selectedSub.has_stems && selectedSub.track_url && (
                              <button
                                onClick={() => {
                                  const match = selectedSub.track_url?.match(/sync-submissions\/(.+)$/);
                                  const filePath = match ? match[1].replace('.mp3', '_stems.zip') : (selectedSub.track_url?.replace('.mp3', '_stems.zip') || '');
                                  handleDownloadSyncRequest('sync-submissions', filePath, `${selectedSub.track_name || 'Track'}_Stems.zip`);
                                }}
                                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm flex items-center gap-2"
                                title="Download Stems"
                              >
                                <Download className="w-3 h-3" />
                                Download Stems
                              </button>
                            )}
                            
                            {/* Split Sheet Download - Always available as it's typically generated */}
                            {selectedSub.track_url && (
                              <button
                                onClick={() => {
                                  const match = selectedSub.track_url?.match(/sync-submissions\/(.+)$/);
                                  const filePath = match ? match[1].replace('.mp3', '_split_sheet.pdf') : (selectedSub.track_url?.replace('.mp3', '_split_sheet.pdf') || '');
                                  handleDownloadSyncRequest('sync-submissions', filePath, `${selectedSub.track_name || 'Track'}_SplitSheet.pdf`);
                                }}
                                className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm flex items-center gap-2"
                                title="Download Split Sheet"
                              >
                                <Download className="w-3 h-3" />
                                Download Split Sheet
                              </button>
                            )}
                            
                            {/* Show message if no additional files are available */}
                            {!selectedSub.has_trackouts && !selectedSub.has_stems && (
                              <div className="text-xs text-gray-400 mt-2">
                                Note: Producer has not indicated availability of trackouts or stems
                              </div>
                            )}
                          </>
                        );
                      })()}
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
                  {/* Render submissions for this request */}
                  {submissions[req.id] && submissions[req.id].length > 0 ? (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(() => {
                        const filteredSubmissions = submissions[req.id].filter(sub => {
                          // If request is paid, only show the selected submission
                          if (req.payment_status === 'paid' || paidRequests[req.id]) {
                            return selectedPerRequest[req.id] === sub.id;
                          }
                          // Otherwise, show all submissions except hidden ones
                          return !hiddenSubmissions[req.id] || !hiddenSubmissions[req.id].has(sub.id);
                        });
                        
                        // If request is paid but no selected submission is found, show a message
                        if ((req.payment_status === 'paid' || paidRequests[req.id]) && filteredSubmissions.length === 0) {
                          return (
                            <div className="col-span-full text-center py-8">
                              <div className="text-gray-400">
                                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                                <p className="text-lg font-semibold mb-2">Request Completed</p>
                                <p>This request has been paid and completed. The selected submission is no longer available for viewing.</p>
                              </div>
                            </div>
                          );
                        }
                        
                        return filteredSubmissions.map((sub) => (
                          <div key={sub.id} className="bg-blue-900/60 rounded-lg p-3 mb-2 flex flex-col gap-2 relative">
                            <div className="flex items-center gap-2 mb-1">
                              <button
                                className={`text-yellow-400 hover:text-yellow-300 focus:outline-none ${favoriteIds.has(sub.id) ? 'font-bold' : ''}`}
                                onClick={() => handleFavorite(sub)}
                                title={favoriteIds.has(sub.id) ? 'Unfavorite' : 'Favorite'}
                              >
                                <Star className={`w-5 h-5 ${favoriteIds.has(sub.id) ? 'fill-yellow-400' : ''}`} />
                              </button>
                              <span className="text-white font-semibold text-lg">{sub.track_name || 'Untitled Track'}</span>
                            </div>
                            <div className="text-blue-200 text-sm">
                              Producer: <button type="button" className="underline hover:text-blue-400" onClick={e => { e.stopPropagation(); setProducerProfileId(sub.producer_id || ''); setShowProducerProfileDialog(true); }}>{sub.producer_name || 'Unknown'}</button>
                            </div>
                            <div className="text-blue-200 text-xs">BPM: {sub.track_bpm} | Key: {sub.track_key}</div>
                            {sub.signed_mp3_url && (
                              <div className="my-2">
                                <AudioPlayer src={sub.signed_mp3_url} title={sub.track_name || 'Track'} size="sm" audioId={`customsync-${sub.id}`} />
                              </div>
                            )}
                            {/* Select button if not already selected */}
                            {!selectedPerRequest[req.id] && (
                              <button
                                className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow"
                                onClick={() => handleSelect(req.id, sub.id)}
                              >
                                Select
                              </button>
                            )}
                            {/* If this is the selected submission, show message and payment controls */}
                            {selectedPerRequest[req.id] === sub.id && (
                              <div className="flex flex-col gap-2 mt-2">
                                <span className="px-2 py-1 bg-green-700 text-white rounded-full text-xs flex items-center gap-2">
                                  <BadgeCheck className="w-4 h-4" /> Selected
                                </span>
                                <button
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow"
                                  onClick={async () => {
                                    if (!selectedSubmission || selectedSubmission.reqId !== req.id || selectedSubmission.sub.id !== sub.id) {
                                      setSelectedSubmission({ reqId: req.id, sub });
                                      setPendingChatOpen(true);
                                    } else {
                                      await handleMessageProducer();
                                    }
                                  }}
                                >
                                  Message Producer
                                  {unreadCounts[req.id] > 0 && (
                                    <img
                                      src="/icons/new-message.png"
                                      alt="New message"
                                      className="inline-block w-6 h-6 ml-2 animate-bounce"
                                    />
                                  )}
                                </button>
                                {req.payment_status !== 'paid' && !paidRequests[req.id] && (
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
                                )}
                                {req.payment_status !== 'paid' && (
                                  <div className="text-sm text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                                    <div className="font-semibold">Payment Terms: {formatPaymentTerms(req.payment_terms)}</div>
                                    <div>Due Date: {calculatePaymentDueDate(req.payment_terms).toLocaleDateString()}</div>
                                    <div className="text-xs text-yellow-200 mt-1">
                                      Amount: ${req.sync_fee.toFixed(2)} (Pending Payment)
                                    </div>
                                  </div>
                                )}
                                <button
                                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold shadow"
                                  onClick={handleDeselect}
                                >
                                  De-select
                                </button>
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  ) : (
                    <div className="text-blue-300 mt-4">No submissions yet.</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      {confirmSelect && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Confirm Selection</h2>
            <p className="mb-6 text-gray-700">Selecting this track will decline all other submissions for this request. Are you sure you want to proceed?</p>
            <div className="flex justify-end gap-4">
              <button type="button" onClick={cancelSelect} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Cancel</button>
              <button type="button" onClick={confirmSelectSubmission} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold">Yes, Select</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Dialog */}
      {showChatDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-blue-900/90 rounded-xl max-w-2xl w-full h-[600px] flex flex-col shadow-lg">
            <div className="p-4 border-b border-blue-700/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Chat with {selectedSubmission?.sub.producer_name || 'Producer'}
                </h3>
                <p className="text-sm text-blue-300">Sync Request: {selectedSubmission?.sub.track_name || 'Custom Sync'}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowChatDialog(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatDialogMessagesRef}>
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender.email === user?.email ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${message.sender.email === user?.email ? 'bg-blue-600 text-white' : 'bg-blue-800/60 text-gray-300'}`}
                    >
                      <p className="text-sm font-medium mb-1">
                        {message.sender.first_name || message.sender.last_name
                          ? <button type="button" className="underline hover:text-blue-400" onClick={e => { e.stopPropagation(); setProducerProfileId(message.sender.id); setShowProducerProfileDialog(true); }}>{`${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim()}</button>
                          : (message.sender.email === user?.email ? 'You' : 'Unknown')}
                      </p>
                      <p>{message.message}</p>
                      <p className="text-xs opacity-70 mt-1">{new Date(message.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-blue-700/40 flex space-x-2">
              <input
                type="text"
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
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
            </form>
          </div>
        </div>
      )}

      <ProducerProfileDialog isOpen={!!showProducerProfileDialog && !!producerProfileId} onClose={() => setShowProducerProfileDialog(false)} producerId={producerProfileId || ''} />
    </div>
  );
} 