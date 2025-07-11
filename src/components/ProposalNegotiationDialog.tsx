import React, { useState, useEffect } from 'react';
import { X, Send, Clock, DollarSign, Check, X as XIcon, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ProposalNegotiationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: any;
  onNegotiationSent: () => void;
}

interface NegotiationMessage {
  id: string;
  sender: {
    first_name: string;
    last_name: string;
    email: string;
  };
  message: string;
  counter_offer?: number;
  counter_terms?: string;
  counter_payment_terms?: string;
  created_at: string;
}

const PAYMENT_TERMS_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'net30', label: 'Net 30' },
  { value: 'net60', label: 'Net 60' },
  { value: 'net90', label: 'Net 90' }
];

export function ProposalNegotiationDialog({ isOpen, onClose, proposal: initialProposal, onNegotiationSent }: ProposalNegotiationDialogProps) {
  const { user } = useAuth();
  const [proposal, setProposal] = useState(initialProposal);
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [message, setMessage] = useState('');
  const [counterOffer, setCounterOffer] = useState('');
  const [counterTerms, setCounterTerms] = useState('');
  const [counterPaymentTerms, setCounterPaymentTerms] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingNegotiation, setPendingNegotiation] = useState<NegotiationMessage | null>(null);
  const [detectedPaymentTerms, setDetectedPaymentTerms] = useState<string | null>(null);

  // Update proposal when initialProposal changes
  useEffect(() => {
    setProposal(initialProposal);
  }, [initialProposal]);

  useEffect(() => {
    if (isOpen && proposal) {
      fetchNegotiationHistory();
    }
  }, [isOpen, proposal]);

  // Check for pending negotiations when proposal status changes
  useEffect(() => {
    if (isOpen && proposal && proposal.negotiation_status === 'client_acceptance_required') {
      // Re-fetch to check for pending negotiations
      fetchNegotiationHistory();
    }
  }, [proposal?.negotiation_status, isOpen]);

  const fetchNegotiationHistory = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch negotiation messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('proposal_negotiations')
        .select(`
          id,
          message,
          counter_offer,
          counter_terms,
          counter_payment_terms,
          created_at,
          sender:profiles!sender_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('proposal_id', proposal.id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Normalize sender field in case it's an array
      const normalizedMessages = (messagesData || []).map((msg: any) => ({
        ...msg,
        sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender
      }));
      setMessages(normalizedMessages);

      // Check if there's a pending negotiation that needs acceptance/decline
      const lastMessage = normalizedMessages[normalizedMessages.length - 1];
      
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
      
      // Only show accept/decline for clients when there's a counter offer from producer
      const isClient = user && proposal.client_id === user.id;
      const isProducer = user && proposal.proposal_producer_id === user.id;
      const hasPendingNegotiation = lastMessage && 
          user && lastMessage.sender.email !== user.email && 
          hasCounterOffer &&
          isClient && // Only show for clients
          (proposal.negotiation_status === 'client_acceptance_required' || 
           proposal.negotiation_status === 'negotiating' ||
           proposal.negotiation_status === 'pending');
      
      // Debug logging
      console.log('=== NEGOTIATION DEBUG START ===');
      console.log('Last message:', lastMessage);
      console.log('Has pending negotiation:', hasPendingNegotiation);
      console.log('Has counter offer:', hasCounterOffer);
      console.log('Counter offer amount:', lastMessage?.counter_offer);
      console.log('Counter payment terms:', lastMessage?.counter_payment_terms);
      console.log('Detected payment terms:', detectedPaymentTerms);
      console.log('Counter terms:', lastMessage?.counter_terms);
      console.log('Message text analysis:', lastMessage?.message ? {
        hasCounter: lastMessage.message.toLowerCase().includes('counter'),
        hasPropose: lastMessage.message.toLowerCase().includes('propose'),
        hasSuggest: lastMessage.message.toLowerCase().includes('suggest'),
        hasOffer: lastMessage.message.toLowerCase().includes('offer'),
        hasNet30: lastMessage.message.toLowerCase().includes('net30') || lastMessage.message.toLowerCase().includes('net 30'),
        hasNet60: lastMessage.message.toLowerCase().includes('net60') || lastMessage.message.toLowerCase().includes('net 60'),
        hasNet90: lastMessage.message.toLowerCase().includes('net90') || lastMessage.message.toLowerCase().includes('net 90'),
        hasImmediate: lastMessage.message.toLowerCase().includes('immediate')
      } : 'No message');
      console.log('Sender email:', lastMessage?.sender?.email);
      console.log('User email:', user?.email);
      console.log('User role - isClient:', isClient, 'isProducer:', isProducer);
      console.log('Client ID:', proposal.client_id, 'Producer ID:', proposal.proposal_producer_id, 'User ID:', user?.id);
      console.log('Show accept/decline:', hasPendingNegotiation);
      console.log('Proposal status:', proposal.negotiation_status);
      console.log('Messages count:', messagesData?.length);
      console.log('Is last message from other user:', lastMessage && user && lastMessage.sender.email !== user.email);
      console.log('Has unresponded message:', lastMessage && user && lastMessage.sender.email !== user.email && proposal.negotiation_status !== 'accepted' && proposal.negotiation_status !== 'rejected');
      console.log('Payment terms options:', PAYMENT_TERMS_OPTIONS);
      console.log('Payment terms match:', lastMessage?.counter_payment_terms ? PAYMENT_TERMS_OPTIONS.find(opt => opt.value === lastMessage.counter_payment_terms) : null);
      console.log('=== NEGOTIATION DEBUG END ===');

      if (hasPendingNegotiation) {
        setPendingNegotiation(lastMessage);
      } else {
        // More aggressive fallback: if there's any message from the other party and we haven't responded yet
        const hasUnrespondedMessage = lastMessage && 
          user && lastMessage.sender.email !== user.email && 
          isClient && // Only show for clients
          proposal.negotiation_status !== 'accepted' &&
          proposal.negotiation_status !== 'rejected';
        
        if (hasUnrespondedMessage) {
          console.log('Fallback: Showing accept/decline for unresponded message');
          setPendingNegotiation(lastMessage);
        } else {
          setPendingNegotiation(null);
        }
      }

    } catch (err) {
      console.error('Error fetching negotiation history:', err);
      setError('Failed to load negotiation history');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleAcceptNegotiation = async () => {
    if (!pendingNegotiation || !user) return;

    try {
      setLoading(true);
      setError('');

      // First, update the negotiated terms in the proposal
      const updates: any = {};

      if (pendingNegotiation.counter_offer) {
        updates.negotiated_amount = pendingNegotiation.counter_offer;
      }

      // Use detected payment terms if database field is null
      const paymentTermsToUse = pendingNegotiation.counter_payment_terms || detectedPaymentTerms;
      if (paymentTermsToUse) {
        updates.negotiated_payment_terms = paymentTermsToUse;
      }

      // Update the proposal with negotiated terms first
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('sync_proposals')
          .update(updates)
          .eq('id', proposal.id);

        if (updateError) throw updateError;
      }

      // Use the database function to handle the acceptance properly
      const { error: functionError } = await supabase.rpc('handle_negotiation_acceptance', {
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

      // Add acceptance message
      const { error: messageError } = await supabase
        .from('proposal_negotiations')
        .insert({
          proposal_id: proposal.id,
          sender_id: user.id,
          message: `Accepted the proposed changes: ${pendingNegotiation.counter_offer ? `Amount: $${pendingNegotiation.counter_offer}` : ''} ${paymentTermsToUse ? `Payment Terms: ${PAYMENT_TERMS_OPTIONS.find(opt => opt.value === paymentTermsToUse)?.label}` : ''}`.trim(),
          counter_offer: pendingNegotiation.counter_offer,
          counter_payment_terms: paymentTermsToUse
        });

      if (messageError) throw messageError;

      setPendingNegotiation(null);
      onNegotiationSent();
    } catch (err) {
      console.error('Error accepting negotiation:', err);
      setError('Failed to accept negotiation');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineNegotiation = async () => {
    if (!pendingNegotiation || !user) return;

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
      onNegotiationSent();
    } catch (err) {
      console.error('Error declining negotiation:', err);
      setError('Failed to decline negotiation');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !proposal) return;

    try {
      setLoading(true);
      setError('');

      if (!message.trim() && !counterOffer && !counterTerms && !counterPaymentTerms) {
        throw new Error('Please enter a message or make a counter offer');
      }

      // Determine recipient email
      const recipientEmail = user.id === proposal.client_id 
        ? proposal.track?.producer?.email 
        : proposal.client?.email;

      if (!recipientEmail) {
        throw new Error('Could not determine recipient email');
      }

      // Call the negotiation function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-negotiation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proposalId: proposal.id,
          senderId: user.id,
          message: message.trim(),
          counterOffer: counterOffer ? parseFloat(counterOffer) : null,
          counterTerms: counterTerms || null,
          counterPaymentTerms: counterPaymentTerms || null,
          recipientEmail
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send negotiation');
      }

      // Clear form
      setMessage('');
      setCounterOffer('');
      setCounterTerms('');
      setCounterPaymentTerms('');
      setSelectedFile(null);

      // Refresh messages - fetch the updated list instead of manually adding
      onNegotiationSent();
    } catch (err) {
      console.error('Error submitting negotiation:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit negotiation');
    } finally {
      setLoading(false);
    }
  };

  // Accept/Decline handlers
  const handleAcceptCounter = async () => {
    if (!user || !proposal) return;
    setLoading(true);
    setError('');
    try {
      // Call backend to record acceptance
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/respond-to-counter`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proposalId: proposal.id,
          negotiationId: messages[messages.length - 1]?.id,
          action: 'accept',
          userId: user.id
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept counter');
      }
      onNegotiationSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept counter');
    } finally {
      setLoading(false);
    }
  };
  const handleDeclineCounter = async () => {
    if (!user || !proposal) return;
    setLoading(true);
    setError('');
    try {
      // Call backend to record declination
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/respond-to-counter`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proposalId: proposal.id,
          negotiationId: messages[messages.length - 1]?.id,
          action: 'decline',
          userId: user.id
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to decline counter');
      }
      onNegotiationSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline counter');
    } finally {
      setLoading(false);
    }
  };

  // Determine if the current user should see accept/decline
  const isClient = user && proposal?.client_id === user.id;
  const isProducer = user && proposal?.track?.producer?.id === user.id;
  const needsClientAcceptance = proposal?.negotiation_status === 'client_acceptance_required' && isClient;
  const needsProducerAcceptance = proposal?.negotiation_status === 'producer_acceptance_required' && isProducer;
  const showAcceptDecline = needsClientAcceptance || needsProducerAcceptance;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-blue-900/90 backdrop-blur-md p-6 rounded-xl border border-purple-500/20 w-full max-w-2xl max-h-[95vh] flex flex-col">
        {/* Track and Terms Header */}
        <div className="mb-4 p-4 bg-white/10 rounded-lg flex-shrink-0">
          <div className="text-lg font-bold text-white mb-1">{proposal?.track?.title || 'Untitled Track'}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-200 text-sm">
            <div>
              <span className="font-medium">Sync Fee:</span> 
              <span className={`ml-1 ${proposal?.negotiation_status === 'accepted' && proposal?.final_amount ? 'text-green-400 font-semibold' : ''}`}>
                ${proposal?.final_amount || proposal?.sync_fee || 'N/A'}
              </span>
              {proposal?.negotiation_status === 'accepted' && proposal?.final_amount && (
                <span className="ml-2 text-xs text-green-400">✓ Updated</span>
              )}
            </div>
            <div>
              <span className="font-medium">Payment Terms:</span> 
              <span className={`ml-1 ${proposal?.negotiation_status === 'accepted' && proposal?.final_payment_terms ? 'text-green-400 font-semibold' : ''}`}>
                {proposal?.final_payment_terms ? 
                  PAYMENT_TERMS_OPTIONS.find(opt => opt.value === proposal.final_payment_terms)?.label :
                  proposal?.payment_terms || 'N/A'
                }
              </span>
              {proposal?.negotiation_status === 'accepted' && proposal?.final_payment_terms && (
                <span className="ml-2 text-xs text-green-400">✓ Updated</span>
              )}
            </div>
            <div><span className="font-medium">Exclusivity:</span> {proposal?.is_exclusive ? 'Exclusive' : 'Non-exclusive'}</div>
          </div>
        </div>
        {/* End Track and Terms Header */}

        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Negotiate Proposal</h2>
            <p className="text-gray-400 text-sm">
              Client: {proposal?.client?.first_name} {proposal?.client?.last_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex-shrink-0">
            <p className="text-red-400 text-center font-medium">{error}</p>
          </div>
        )}

        {/* Accept/Decline Negotiation Section */}
        {showAcceptDecline && pendingNegotiation && (
          <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex-shrink-0">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Review Proposed Changes</h3>
            <div className="space-y-2 text-gray-300">
              {pendingNegotiation.counter_offer && (
                <p><span className="font-medium">New Amount:</span> ${pendingNegotiation.counter_offer.toFixed(2)}</p>
              )}
              {(pendingNegotiation.counter_payment_terms || detectedPaymentTerms) && (
                <p><span className="font-medium">New Payment Terms:</span> <span className="text-green-400 font-semibold">{PAYMENT_TERMS_OPTIONS.find(opt => opt.value === (pendingNegotiation.counter_payment_terms || detectedPaymentTerms))?.label}</span> {!pendingNegotiation.counter_payment_terms && detectedPaymentTerms && <span className="text-yellow-400 text-xs">(detected from message)</span>}</p>
              )}
              {pendingNegotiation.counter_terms && (
                <p><span className="font-medium">Additional Terms:</span> {pendingNegotiation.counter_terms}</p>
              )}
            </div>
            <div className="mt-3 p-3 bg-blue-950/40 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Next Steps:</strong> After you accept, the producer will need to confirm the terms. 
                Once both parties agree, payment will be due according to the payment terms.
              </p>
            </div>
            {/* Accept/Decline Buttons */}
            <div className="flex space-x-4 mt-4">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={handleAcceptCounter}
                disabled={loading}
              >
                Accept Terms
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={handleDeclineCounter}
                disabled={loading}
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-0">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 rounded-lg ${
                msg.sender.email === user?.email
                  ? 'bg-purple-950/40 ml-8'
                  : 'bg-white/5 mr-8'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-gray-400">
                  {msg.sender.first_name} {msg.sender.last_name}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(msg.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-white mb-2">{msg.message}</p>
              {msg.counter_offer && (
                <p className="text-green-400 font-semibold flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Counter Offer: ${msg.counter_offer.toFixed(2)}
                </p>
              )}
              {msg.counter_payment_terms && !msg.message.includes(PAYMENT_TERMS_OPTIONS.find(opt => opt.value === msg.counter_payment_terms)?.label || '') && (
                <p className="text-green-400 font-semibold flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Counter Payment Terms: {PAYMENT_TERMS_OPTIONS.find(opt => opt.value === msg.counter_payment_terms)?.label}
                </p>
              )}
              {msg.counter_terms && !msg.message.includes(msg.counter_terms) && (
                <p className="text-blue-400">
                  Proposed Terms: {msg.counter_terms}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Form Area - Fixed at bottom */}
        <form onSubmit={handleSubmit} className="space-y-4 flex-shrink-0">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full bg-blue-950/60 border border-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 p-3"
              placeholder="Enter your message..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Counter Offer (Optional)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={counterOffer}
                  onChange={(e) => setCounterOffer(e.target.value)}
                  className="w-full pl-10 bg-blue-950/60 border border-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="0.00"
                  step="0.01"
                  defaultValue={proposal?.sync_fee?.toString()}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Propose a different sync fee amount for this proposal
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Payment Terms (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={counterPaymentTerms}
                  onChange={(e) => setCounterPaymentTerms(e.target.value)}
                  className="w-full pl-10 bg-blue-950/60 border border-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 p-3"
                >
                  <option value="">Select Payment Terms</option>
                  {PAYMENT_TERMS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Propose different payment terms for this sync proposal
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Additional Terms (Optional)
              </label>
              <input
                type="text"
                value={counterTerms}
                onChange={(e) => setCounterTerms(e.target.value)}
                className="w-full bg-blue-950/60 border border-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 p-3"
                placeholder="e.g., 2-year license"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Attach File (Optional)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-purple-600 file:text-white
                hover:file:bg-purple-700
                file:cursor-pointer file:transition-colors"
              accept=".mp4,.mov,.pdf,.doc,.docx"
            />
            <p className="mt-1 text-xs text-gray-400">
              Max file size: 10MB. Accepted formats: MP4, MOV, PDF, DOC, DOCX
            </p>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <Clock className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Sending...
                </span>
              ) : (
                <span className="flex items-center">
                  <Send className="w-5 h-5 mr-2" />
                  Send Response
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
