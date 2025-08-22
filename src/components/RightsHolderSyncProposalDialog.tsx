import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { supabase } from '../lib/supabase';
import { 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  DollarSign,
  Calendar,
  User,
  Send,
  ArrowLeft,
  X,
  FileText,
  Music,
  Download
} from 'lucide-react';

interface SyncProposal {
  id: string;
  track_id: string;
  client_id: string;
  project_type: string;
  sync_fee: number;
  payment_terms: string;
  is_exclusive: boolean;
  expiration_date: string;
  is_urgent: boolean;
  status: string;
  client_status: string;
  producer_status: string;
  negotiation_status: string;
  last_message_sender_id?: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  client: {
    first_name: string;
    last_name: string;
    email: string;
  };
  track: {
    id: string;
    title: string;
    artist: string;
    audio_url: string;
    image_url?: string;
  };
}

interface NegotiationMessage {
  id: string;
  proposal_id: string;
  sender_id: string;
  message: string;
  counter_offer?: number;
  counter_terms?: string;
  counter_payment_terms?: string;
  created_at: string;
  sender: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export function RightsHolderSyncProposalDialog() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUnifiedAuth();
  const [proposal, setProposal] = useState<SyncProposal | null>(null);
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [counterOffer, setCounterOffer] = useState('');
  const [counterTerms, setCounterTerms] = useState('');
  const [counterPaymentTerms, setCounterPaymentTerms] = useState('immediate');

  useEffect(() => {
    if (id && user) {
      fetchProposalDetails();
      fetchNegotiationHistory();
    }
  }, [id, user]);

  const fetchProposalDetails = async () => {
    if (!id || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data: proposalData, error: proposalError } = await supabase
        .from('sync_proposals')
        .select(`
          *,
          client:profiles!sync_proposals_client_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          track:tracks(
            id,
            title,
            artist,
            audio_url,
            image_url
          )
        `)
        .eq('id', id)
        .single();
      
      if (proposalError) throw proposalError;
      
      setProposal(proposalData);
    } catch (error) {
      console.error('Error fetching proposal details:', error);
      setError('Failed to load proposal details');
    } finally {
      setLoading(false);
    }
  };

  const fetchNegotiationHistory = async () => {
    if (!id) return;
    
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('proposal_negotiations')
        .select(`
          *,
          sender:profiles!proposal_negotiations_sender_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('proposal_id', id)
        .order('created_at', { ascending: true });
      
      if (messagesError) throw messagesError;
      
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error fetching negotiation history:', error);
    }
  };

  const sendMessage = async () => {
    if (!id || !user || !newMessage.trim()) return;
    
    try {
      setSendingMessage(true);
      
      const messageData: any = {
        proposal_id: id,
        sender_id: user.id,
        message: newMessage.trim()
      };

      // Add counter offer if provided
      if (counterOffer && !isNaN(parseFloat(counterOffer))) {
        messageData.counter_offer = parseFloat(counterOffer);
      }

      if (counterTerms.trim()) {
        messageData.counter_terms = counterTerms.trim();
      }

      if (counterPaymentTerms) {
        messageData.counter_payment_terms = counterPaymentTerms;
      }

      const { error: messageError } = await supabase
        .from('proposal_negotiations')
        .insert(messageData);

      if (messageError) throw messageError;

      // Update proposal status
      const { error: updateError } = await supabase
        .from('sync_proposals')
        .update({
          negotiation_status: 'negotiating',
          last_message_sender_id: user.id,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Refresh data
      setNewMessage('');
      setCounterOffer('');
      setCounterTerms('');
      setCounterPaymentTerms('immediate');
      await fetchNegotiationHistory();
      await fetchProposalDetails();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAcceptProposal = async () => {
    if (!id || !user) return;
    
    try {
      const { error } = await supabase
        .from('sync_proposals')
        .update({
          producer_status: 'accepted',
          status: 'accepted',
          negotiation_status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await fetchProposalDetails();
    } catch (error) {
      console.error('Error accepting proposal:', error);
      setError('Failed to accept proposal');
    }
  };

  const handleRejectProposal = async () => {
    if (!id || !user) return;
    
    try {
      const { error } = await supabase
        .from('sync_proposals')
        .update({
          producer_status: 'rejected',
          status: 'rejected',
          negotiation_status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await fetchProposalDetails();
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      setError('Failed to reject proposal');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-400 bg-green-400/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'rejected':
        return 'text-red-400 bg-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading proposal details...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">{error || 'Proposal not found'}</p>
          <Link
            to="/sync-proposals"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Proposals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-900/90 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link
              to="/sync-proposals"
              className="mr-4 p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Sync Proposal: {proposal.track.title}</h1>
              <p className="text-gray-300">Negotiate with {proposal.client.first_name} {proposal.client.last_name}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(proposal.status)}`}>
            {getStatusIcon(proposal.status)}
            <span className="ml-1">{proposal.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Proposal Details */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Proposal Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Track</label>
                  <p className="text-white font-medium">{proposal.track.title}</p>
                  <p className="text-gray-400">{proposal.track.artist}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Client</label>
                  <p className="text-white font-medium">
                    {proposal.client.first_name} {proposal.client.last_name}
                  </p>
                  <p className="text-gray-400">{proposal.client.email}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Project Type</label>
                  <p className="text-white">{proposal.project_type}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Sync Fee</label>
                  <p className="text-white font-medium">${proposal.sync_fee}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Payment Terms</label>
                  <p className="text-white">{proposal.payment_terms}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Exclusive</label>
                  <p className="text-white">{proposal.is_exclusive ? 'Yes' : 'No'}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Expires</label>
                  <p className="text-white">{formatDate(proposal.expiration_date)}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Created</label>
                  <p className="text-white">{formatDate(proposal.created_at)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {proposal.status === 'pending' && (
                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleAcceptProposal}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Accept Proposal
                  </button>
                  <button
                    onClick={handleRejectProposal}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Reject Proposal
                  </button>
                </div>
              )}
            </div>

            {/* Track Preview */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">Track Preview</h2>
              {proposal.track.image_url && (
                <img
                  src={proposal.track.image_url}
                  alt={proposal.track.title}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
              )}
              <audio
                controls
                className="w-full"
                src={proposal.track.audio_url}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>

          {/* Negotiation Chat */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">Negotiation</h2>
              
              {/* Messages */}
              <div className="h-96 overflow-y-auto mb-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No messages yet</p>
                    <p className="text-sm text-gray-500">Start the conversation by sending a message</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                        message.sender_id === user?.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-white'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">
                            {message.sender.first_name} {message.sender.last_name}
                          </span>
                          <span className="text-xs opacity-75">
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                        {(message.counter_offer || message.counter_terms || message.counter_payment_terms) && (
                          <div className="mt-2 pt-2 border-t border-white/20">
                            {message.counter_offer && (
                              <p className="text-xs">Counter Offer: ${message.counter_offer}</p>
                            )}
                            {message.counter_terms && (
                              <p className="text-xs">Counter Terms: {message.counter_terms}</p>
                            )}
                            {message.counter_payment_terms && (
                              <p className="text-xs">Counter Payment: {message.counter_payment_terms}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              {proposal.status === 'pending' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Counter Offer Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Counter Offer ($)
                      </label>
                      <input
                        type="number"
                        value={counterOffer}
                        onChange={(e) => setCounterOffer(e.target.value)}
                        placeholder="Optional"
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Counter Terms
                      </label>
                      <input
                        type="text"
                        value={counterTerms}
                        onChange={(e) => setCounterTerms(e.target.value)}
                        placeholder="Optional"
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Counter Payment Terms
                      </label>
                      <select
                        value={counterPaymentTerms}
                        onChange={(e) => setCounterPaymentTerms(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="immediate">Immediate</option>
                        <option value="net30">Net 30</option>
                        <option value="net60">Net 60</option>
                        <option value="net90">Net 90</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={sendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    {sendingMessage ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
