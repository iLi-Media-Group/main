import React, { useState, useEffect } from 'react';
import { X, Send, Clock, DollarSign, Check, X as XIcon } from 'lucide-react';
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
  const [showAcceptDecline, setShowAcceptDecline] = useState(false);
  const [pendingNegotiation, setPendingNegotiation] = useState<NegotiationMessage | null>(null);

  // Update proposal when initialProposal changes
  useEffect(() => {
    setProposal(initialProposal);
  }, [initialProposal]);

  useEffect(() => {
    if (isOpen && proposal) {
      fetchNegotiationHistory();
    }
  }, [isOpen, proposal]);

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

      setMessages(messagesData || []);

      // Check if there's a pending negotiation that needs acceptance/decline
      const lastMessage = messagesData?.[messagesData.length - 1];
      const hasPendingNegotiation = lastMessage && 
          lastMessage.sender.email !== user?.email && 
          (lastMessage.counter_offer || lastMessage.counter_terms || lastMessage.counter_payment_terms);
      
      const hasPendingStatus = proposal?.negotiation_status === 'client_acceptance_required' || 
                              proposal?.negotiation_status === 'negotiating';
      
      if ((hasPendingNegotiation || hasPendingStatus) && !showAcceptDecline) {
        // If there's a pending negotiation message, use that
        if (hasPendingNegotiation) {
          setPendingNegotiation(lastMessage);
        } else {
          // If there's a pending status but no recent message with changes, create a placeholder
          setPendingNegotiation({
            id: 'pending',
            sender: { first_name: 'System', last_name: '', email: 'system' },
            message: 'Pending negotiation changes',
            counter_offer: undefined,
            counter_terms: undefined,
            counter_payment_terms: proposal?.negotiated_payment_terms || undefined,
            created_at: new Date().toISOString()
          });
        }
        setShowAcceptDecline(true);
      } else if (!hasPendingNegotiation && !hasPendingStatus) {
        // Hide accept/decline if no pending negotiation
        setShowAcceptDecline(false);
        setPendingNegotiation(null);
      }
    } catch (err) {
      console.error('Error fetching negotiation messages:', err);
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

      // Update the proposal with the accepted terms
      const updates: any = {
        negotiation_status: 'accepted',
        client_accepted_at: new Date().toISOString()
      };

      if (pendingNegotiation.counter_offer) {
        updates.negotiated_amount = pendingNegotiation.counter_offer;
        updates.final_amount = pendingNegotiation.counter_offer;
        updates.sync_fee = pendingNegotiation.counter_offer; // Update the sync_fee to show in UI
      }

      if (pendingNegotiation.counter_payment_terms) {
        updates.negotiated_payment_terms = pendingNegotiation.counter_payment_terms;
        updates.final_payment_terms = pendingNegotiation.counter_payment_terms;
        updates.payment_terms = pendingNegotiation.counter_payment_terms; // Update the payment_terms to show in UI
      }

      // Also update the main status to reflect the acceptance
      updates.status = 'accepted';
      updates.client_status = 'accepted';

      const { error: updateError } = await supabase
        .from('sync_proposals')
        .update(updates)
        .eq('id', proposal.id);

      if (updateError) throw updateError;

      // Update the local proposal object to reflect changes in UI
      if (pendingNegotiation.counter_offer) {
        proposal.sync_fee = pendingNegotiation.counter_offer;
        proposal.final_amount = pendingNegotiation.counter_offer;
        proposal.negotiated_amount = pendingNegotiation.counter_offer;
      }
      if (pendingNegotiation.counter_payment_terms) {
        proposal.payment_terms = pendingNegotiation.counter_payment_terms;
        proposal.final_payment_terms = pendingNegotiation.counter_payment_terms;
        proposal.negotiated_payment_terms = pendingNegotiation.counter_payment_terms;
      }
      proposal.negotiation_status = 'accepted';
      proposal.status = 'accepted';
      proposal.client_status = 'accepted';
      proposal.client_accepted_at = new Date().toISOString();

      // Force re-render by updating state
      setProposal({ ...proposal });

      // Add acceptance message
      const { error: messageError } = await supabase
        .from('proposal_negotiations')
        .insert({
          proposal_id: proposal.id,
          sender_id: user.id,
          message: `Accepted the proposed changes: ${pendingNegotiation.counter_offer ? `Amount: $${pendingNegotiation.counter_offer}` : ''} ${pendingNegotiation.counter_payment_terms ? `Payment Terms: ${PAYMENT_TERMS_OPTIONS.find(opt => opt.value === pendingNegotiation.counter_payment_terms)?.label}` : ''}`.trim(),
          counter_offer: pendingNegotiation.counter_offer,
          counter_payment_terms: pendingNegotiation.counter_payment_terms
        });

      if (messageError) throw messageError;

      setShowAcceptDecline(false);
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

      // Add decline message
      const { error: messageError } = await supabase
        .from('proposal_negotiations')
        .insert({
          proposal_id: proposal.id,
          sender_id: user.id,
          message: `Declined the proposed changes: ${pendingNegotiation.counter_offer ? `Amount: $${pendingNegotiation.counter_offer}` : ''} ${pendingNegotiation.counter_payment_terms ? `Payment Terms: ${PAYMENT_TERMS_OPTIONS.find(opt => opt.value === pendingNegotiation.counter_payment_terms)?.label}` : ''}`.trim()
        });

      if (messageError) throw messageError;

      setShowAcceptDecline(false);
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
    setLoading(true);
    setError('');

    const recipientEmail = proposal?.client?.email || user?.email;
    if (!recipientEmail) {
      setError("Unable to determine recipient email. Please contact support.");
      setLoading(false);
      return;
    }

    try {
      if (!message.trim()) {
        throw new Error('Please enter a message');
      }

      if (counterOffer && isNaN(parseFloat(counterOffer))) {
        throw new Error('Please enter a valid counter offer amount');
      }

      // Create negotiation message
      const { data: negotiation, error: negotiationError } = await supabase
        .from('proposal_negotiations')
        .insert({
          proposal_id: proposal.id,
          sender_id: user.id,
          message,
          counter_offer: counterOffer ? parseFloat(counterOffer) : null,
          counter_terms: counterTerms.trim() || null,
          counter_payment_terms: counterPaymentTerms || null
        })
        .select()
        .single();

      if (negotiationError) throw negotiationError;

      // Update proposal negotiation status if there are counter offers or terms
      if (counterOffer || counterTerms.trim() || counterPaymentTerms) {
        const { error: statusError } = await supabase
          .from('sync_proposals')
          .update({
            negotiation_status: 'client_acceptance_required',
            updated_at: new Date().toISOString()
          })
          .eq('id', proposal.id);

        if (statusError) {
          console.error('Error updating negotiation status:', statusError);
        } else {
          // Update local proposal state
          proposal.negotiation_status = 'client_acceptance_required';
          proposal.updated_at = new Date().toISOString();
          setProposal({ ...proposal });
        }
      }

      // Upload reference file if provided
      if (selectedFile && negotiation) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${negotiation.id}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('proposal-files')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('proposal-files')
          .getPublicUrl(filePath);

        // Record file in database
        const { error: fileError } = await supabase
          .from('proposal_files')
          .insert({
            proposal_id: proposal.id,
            uploader_id: user.id,
            file_name: selectedFile.name,
            file_url: publicUrl,
            file_type: selectedFile.type,
            file_size: selectedFile.size
          });

        if (fileError) throw fileError;
      }

      // Send notification through edge function
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-negotiation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proposalId: proposal.id,
          senderId: user.id,
          message,
          counterOffer: counterOffer ? parseFloat(counterOffer) : null,
          counterPaymentTerms: counterPaymentTerms || null,
          recipientEmail
        })
      });

      // Reset form
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
              {pendingNegotiation.counter_payment_terms && (
                <p><span className="font-medium">New Payment Terms:</span> {PAYMENT_TERMS_OPTIONS.find(opt => opt.value === pendingNegotiation.counter_payment_terms)?.label}</p>
              )}
              {pendingNegotiation.counter_terms && (
                <p><span className="font-medium">Additional Terms:</span> {pendingNegotiation.counter_terms}</p>
              )}
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={handleAcceptNegotiation}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
              >
                <Check className="w-4 h-4 mr-2" />
                Accept Changes
              </button>
              <button
                onClick={handleDeclineNegotiation}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
              >
                <XIcon className="w-4 h-4 mr-2" />
                Decline Changes
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
                <p className="text-green-400 font-semibold">
                  Counter Offer: ${msg.counter_offer.toFixed(2)}
                </p>
              )}
              {msg.counter_payment_terms && (
                <p className="text-blue-400">
                  Payment Terms: {PAYMENT_TERMS_OPTIONS.find(opt => opt.value === msg.counter_payment_terms)?.label}
                </p>
              )}
              {msg.counter_terms && (
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Payment Terms (Optional)
              </label>
              <select
                value={counterPaymentTerms}
                onChange={(e) => setCounterPaymentTerms(e.target.value)}
                className="w-full bg-blue-950/60 border border-blue-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 p-3"
              >
                <option value="">Select Payment Terms</option>
                {PAYMENT_TERMS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
