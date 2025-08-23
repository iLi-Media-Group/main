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
  Download,
  Check,
  X as XIcon
} from 'lucide-react';
import { RightsHolderSyncProposalAcceptDialog } from './RightsHolderSyncProposalAcceptDialog';

interface SyncProposal {
  id: string;
  track_id: string;
  client_id: string;
  project_type: string;
  sync_fee: number;
  final_amount?: number;
  negotiated_amount?: number;
  payment_terms: string;
  final_payment_terms?: string;
  negotiated_payment_terms?: string;
  is_exclusive: boolean;
  expiration_date: string;
  is_urgent: boolean;
  status: string;
  client_status: string;
  producer_status: string;
  negotiation_status: string;
  client_accepted_at?: string;
  last_message_sender_id?: string;
  last_message_at?: string;
  payment_status?: string;
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

const PAYMENT_TERMS_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'net30', label: 'Net 30' },
  { value: 'net60', label: 'Net 60' },
  { value: 'net90', label: 'Net 90' }
];

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
  
  // Negotiation acceptance states
  const [pendingNegotiation, setPendingNegotiation] = useState<NegotiationMessage | null>(null);
  const [detectedPaymentTerms, setDetectedPaymentTerms] = useState<string | null>(null);
  const [acceptAmount, setAcceptAmount] = useState(true);
  const [acceptPaymentTerms, setAcceptPaymentTerms] = useState(true);
  const [acceptAdditionalTerms, setAcceptAdditionalTerms] = useState(true);
  
  // Accept dialog state
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchProposalDetails();
      fetchNegotiationHistory();
    }
  }, [id, user]);

  // Check for pending negotiations when proposal status changes
  useEffect(() => {
    if (proposal && proposal.negotiation_status === 'client_acceptance_required') {
      fetchNegotiationHistory();
    }
  }, [proposal?.negotiation_status]);

  useEffect(() => {
    // Reset checkboxes when a new negotiation is pending
    if (pendingNegotiation) {
      setAcceptAmount(true);
      setAcceptPaymentTerms(true);
      setAcceptAdditionalTerms(true);
    }
  }, [pendingNegotiation]);

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
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Normalize sender field in case it's an array
      const normalizedMessages = (messagesData || []).map((msg: any) => ({
        ...msg,
        sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender
      }));
      setMessages(normalizedMessages);

      // Check if there's a pending negotiation that needs acceptance/decline
      const lastMessage = normalizedMessages[0]; // First message is now the newest since we order by descending
      
      // Parse message for payment terms if counter_payment_terms is null
      let detectedPaymentTerms = lastMessage?.counter_payment_terms;
      if (!detectedPaymentTerms && lastMessage?.message) {
        const messageLower = lastMessage.message.toLowerCase();
        if (messageLower.includes('net30') || messageLower.includes('net 30')) {
          detectedPaymentTerms = 'net30';
        } else if (messageLower.includes('net60') || messageLower.includes('net 60')) {
          detectedPaymentTerms = 'net60';
        } else if (messageLower.includes('net90') || messageLower.includes('net 90')) {
          detectedPaymentTerms = 'net90';
        } else if (messageLower.includes('immediate')) {
          detectedPaymentTerms = 'immediate';
        }
      }
      setDetectedPaymentTerms(detectedPaymentTerms);
      
      // More robust logic for detecting counter offers
      const hasCounterOffer = lastMessage?.counter_offer || 
                             lastMessage?.counter_terms || 
                             detectedPaymentTerms ||
                             (lastMessage?.message && (
                               lastMessage.message.toLowerCase().includes('counter') ||
                               lastMessage.message.toLowerCase().includes('propose') ||
                               lastMessage.message.toLowerCase().includes('suggest') ||
                               lastMessage.message.toLowerCase().includes('offer')
                             ));
      
      // Only show accept/decline for rights holders when there's a counter offer from client
      const isClient = user && proposal?.client_id === user.id;
      const isRightsHolder = user && proposal?.track?.track_producer_id === user.id;
      const hasPendingNegotiation = lastMessage && 
          user && lastMessage.sender.email !== user.email && 
          hasCounterOffer &&
          isRightsHolder && // Only show for rights holders
          (proposal?.negotiation_status === 'client_acceptance_required' || 
           proposal?.negotiation_status === 'negotiating' ||
           proposal?.negotiation_status === 'pending');
      
      if (hasPendingNegotiation) {
        setPendingNegotiation(lastMessage);
      } else {
        // More aggressive fallback: if there's any message from the other party and we haven't responded yet
        const hasUnrespondedMessage = lastMessage && 
          user && lastMessage.sender.email !== user.email && 
          isRightsHolder && // Only show for rights holders
          proposal?.negotiation_status !== 'accepted' &&
          proposal?.negotiation_status !== 'rejected';
        
        if (hasUnrespondedMessage) {
          setPendingNegotiation(lastMessage);
        } else {
          setPendingNegotiation(null);
        }
      }
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

  const handleAcceptNegotiation = async () => {
    if (!pendingNegotiation || !user || !proposal) return;
    try {
      setLoading(true);
      setError('');
      const updates: any = {};
      let acceptedFields: string[] = [];
      let declinedFields: string[] = [];
      if (pendingNegotiation.counter_offer && acceptAmount) {
        updates.negotiated_amount = pendingNegotiation.counter_offer;
        acceptedFields.push('Amount');
      } else if (pendingNegotiation.counter_offer) {
        declinedFields.push('Amount');
      }
      const paymentTermsToUse = pendingNegotiation.counter_payment_terms || detectedPaymentTerms;
      if (paymentTermsToUse && acceptPaymentTerms) {
        updates.negotiated_payment_terms = paymentTermsToUse;
        acceptedFields.push('Payment Terms');
      } else if (paymentTermsToUse) {
        declinedFields.push('Payment Terms');
      }
      if (pendingNegotiation.counter_terms && acceptAdditionalTerms) {
        updates.negotiated_additional_terms = pendingNegotiation.counter_terms;
        acceptedFields.push('Additional Terms');
      } else if (pendingNegotiation.counter_terms) {
        declinedFields.push('Additional Terms');
      }
      // Only update proposal if any terms accepted
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('sync_proposals')
          .update(updates)
          .eq('id', proposal.id);
        if (updateError) throw updateError;
      }
      // If all terms accepted, finalize negotiation
      if (declinedFields.length === 0) {
        const { error: functionError } = await supabase.rpc('handle_negotiation_acceptance', {
          proposal_id: proposal.id,
          is_sync_proposal: true
        });
        if (functionError) throw functionError;
      }
      // Refresh proposal data
      const { data: updatedProposal, error: fetchError } = await supabase
        .from('sync_proposals')
        .select('*')
        .eq('id', proposal.id)
        .single();
      if (fetchError) throw fetchError;
      setProposal(updatedProposal);
      // Add acceptance/decline message
      const messageParts = [];
      if (acceptedFields.length > 0) messageParts.push(`Accepted: ${acceptedFields.join(', ')}`);
      if (declinedFields.length > 0) messageParts.push(`Declined: ${declinedFields.join(', ')}`);
      const { error: messageError } = await supabase
        .from('proposal_negotiations')
        .insert({
          proposal_id: proposal.id,
          sender_id: user.id,
          message: messageParts.join(' | '),
          counter_offer: acceptAmount ? pendingNegotiation.counter_offer : undefined,
          counter_payment_terms: acceptPaymentTerms ? paymentTermsToUse : undefined,
          counter_terms: acceptAdditionalTerms ? pendingNegotiation.counter_terms : undefined
        });
      if (messageError) throw messageError;
      setPendingNegotiation(null);
      await fetchNegotiationHistory();
      await fetchProposalDetails();
    } catch (err) {
      console.error('Error accepting negotiation:', err);
      setError('Failed to accept negotiation');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineNegotiation = async () => {
    if (!pendingNegotiation || !user || !proposal) return;

    try {
      setLoading(true);
      setError('');

      // Use the database function to handle the rejection properly
      const { error: functionError } = await supabase.rpc('handle_negotiation_rejection', {
        proposal_id: proposal.id,
        is_sync_proposal: true
      });

      if (functionError) throw functionError;

      // Refresh the proposal data to get updated status
      const { data: updatedProposal, error: fetchError } = await supabase
        .from('sync_proposals')
        .select('*')
        .eq('id', proposal.id)
        .single();

      if (fetchError) throw fetchError;

      // Update local proposal state
      setProposal(updatedProposal);

      // Add decline message
      const { error: messageError } = await supabase
        .from('proposal_negotiations')
        .insert({
          proposal_id: proposal.id,
          sender_id: user.id,
          message: `Declined the proposed changes: ${pendingNegotiation.counter_offer ? `Amount: $${pendingNegotiation.counter_offer}` : ''} ${detectedPaymentTerms ? `Payment Terms: ${PAYMENT_TERMS_OPTIONS.find(opt => opt.value === detectedPaymentTerms)?.label}` : ''}`.trim()
        });

      if (messageError) throw messageError;

      setPendingNegotiation(null);
      await fetchNegotiationHistory();
      await fetchProposalDetails();
    } catch (err) {
      console.error('Error declining negotiation:', err);
      setError('Failed to decline negotiation');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProposal = async () => {
    if (!id || !user) return;
    
    try {
      const { error } = await supabase
        .from('sync_proposals')
        .update({
          producer_status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Call the RPC function to handle the acceptance properly
      const { error: rpcError } = await supabase.rpc('handle_negotiation_acceptance', {
        proposal_id: id,
        is_sync_proposal: true
      });

      if (rpcError) throw rpcError;

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
      case 'pending_client':
      case 'pending_producer':
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
      case 'pending_client':
      case 'pending_producer':
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

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case 'pending_client':
        return 'Pending Client Acceptance';
      case 'pending_producer':
        return 'Pending Rights Holder Acceptance';
      default:
        return status;
    }
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
            <span className="ml-1">{getStatusDisplayText(proposal.status)}</span>
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

                {proposal.negotiated_amount && (
                  <div>
                    <label className="text-sm text-gray-400">Negotiated Amount</label>
                    <p className="text-green-400 font-medium">${proposal.negotiated_amount}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-400">Payment Terms</label>
                  <p className="text-white">{proposal.payment_terms}</p>
                </div>

                {proposal.negotiated_payment_terms && (
                  <div>
                    <label className="text-sm text-gray-400">Negotiated Payment Terms</label>
                    <p className="text-green-400">{proposal.negotiated_payment_terms}</p>
                  </div>
                )}

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

                <div>
                  <label className="text-sm text-gray-400">Rights Holder Status</label>
                  <p className={`font-medium ${proposal.producer_status === 'accepted' ? 'text-green-400' : proposal.producer_status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {proposal.producer_status}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Client Status</label>
                  <p className={`font-medium ${proposal.client_status === 'accepted' ? 'text-green-400' : proposal.client_status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {proposal.client_status}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {proposal.status === 'pending' && proposal.producer_status === 'pending' && (
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

              {/* Show accept dialog button when both parties have accepted */}
              {proposal.status === 'accepted' && proposal.producer_status === 'accepted' && proposal.client_status === 'accepted' && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowAcceptDialog(true)}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Proceed to Payment
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
              
              {/* Pending Negotiation Acceptance */}
              {pendingNegotiation && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-3">Review Counter Offer</h3>
                  <div className="space-y-3">
                    {pendingNegotiation.counter_offer && (
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={acceptAmount}
                          onChange={(e) => setAcceptAmount(e.target.checked)}
                          className="rounded border-gray-600 text-yellow-600 focus:ring-yellow-500"
                        />
                        <span className="text-white">
                          Accept counter offer: ${pendingNegotiation.counter_offer}
                        </span>
                      </label>
                    )}
                    
                    {(pendingNegotiation.counter_payment_terms || detectedPaymentTerms) && (
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={acceptPaymentTerms}
                          onChange={(e) => setAcceptPaymentTerms(e.target.checked)}
                          className="rounded border-gray-600 text-yellow-600 focus:ring-yellow-500"
                        />
                        <span className="text-white">
                          Accept payment terms: {PAYMENT_TERMS_OPTIONS.find(opt => opt.value === (pendingNegotiation.counter_payment_terms || detectedPaymentTerms))?.label}
                        </span>
                      </label>
                    )}
                    
                    {pendingNegotiation.counter_terms && (
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={acceptAdditionalTerms}
                          onChange={(e) => setAcceptAdditionalTerms(e.target.checked)}
                          className="rounded border-gray-600 text-yellow-600 focus:ring-yellow-500"
                        />
                        <span className="text-white">
                          Accept additional terms: {pendingNegotiation.counter_terms}
                        </span>
                      </label>
                    )}
                  </div>
                  
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={handleAcceptNegotiation}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors flex items-center"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Accept
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDeclineNegotiation}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg transition-colors flex items-center"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <XIcon className="w-4 h-4 mr-2" />
                          Decline
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              
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
              {proposal.status !== 'accepted' && proposal.status !== 'rejected' && (
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

      {/* Accept Dialog */}
      {showAcceptDialog && proposal && (
        <RightsHolderSyncProposalAcceptDialog
          isOpen={showAcceptDialog}
          onClose={() => setShowAcceptDialog(false)}
          proposal={proposal}
          onAccept={() => {
            setShowAcceptDialog(false);
            fetchProposalDetails();
          }}
        />
      )}
    </div>
  );
}
