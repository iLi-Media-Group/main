import React, { useState, useEffect } from 'react';
import { X, Send, DollarSign, Clock, Upload, AlertTriangle } from 'lucide-react';
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
  created_at: string;
}

export function ProposalNegotiationDialog({ isOpen, onClose, proposal, onNegotiationSent }: ProposalNegotiationDialogProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [counterOffer, setCounterOffer] = useState('');
  const [counterTerms, setCounterTerms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen && proposal?.id) {
      fetchNegotiationHistory();
    }
  }, [isOpen, proposal?.id]);

  const fetchNegotiationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('proposal_negotiations')
        .select(`
          id,
          message,
          counter_offer,
          counter_terms,
          created_at,
          sender:profiles!sender_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('proposal_id', proposal.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setMessages(data);
    } catch (err) {
      console.error('Error fetching negotiation history:', err);
      setError('Failed to load negotiation history');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      if (!message.trim()) {
        throw new Error('Please enter a message');
      }

      if (counterOffer && isNaN(parseFloat(counterOffer))) {
        throw new Error('Please enter a valid counter offer amount');
      }

      // Ensure we have the client email
      let clientEmail = proposal?.client?.email;
      if (!clientEmail && proposal?.client_id) {
        // Fetch client email from Supabase
        const { data: clientProfile, error: clientError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', proposal.client_id)
          .single();
        if (clientProfile && clientProfile.email) {
          clientEmail = clientProfile.email;
        } else {
          throw new Error('Could not determine client email for notification.');
        }
      }

      // Upload reference file if provided
      if (selectedFile) {
        // ... (keep file upload logic if needed, or move to edge function if possible)
      }

      // Send negotiation and notification through edge function
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
          counterTerms: counterTerms.trim() || null,
          recipientEmail: clientEmail
        })
      });

      // Reset form
      setMessage('');
      setCounterOffer('');
      setCounterTerms('');
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

  const handleCounterResponse = async (action: 'accept' | 'decline', negotiationId: string) => {
    if (!user) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/respond-to-counter`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proposalId: proposal.id,
          negotiationId: negotiationId,
          action: action,
          userId: user.id,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} counter offer.`);
      }

      onNegotiationSent(); // This will close the dialog and refresh data
    } catch (err) {
      console.error(`Error ${action}ing counter:`, err);
      setError(err instanceof Error ? err.message : `An unknown error occurred.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-blue-900 p-8 rounded-xl border border-purple-500/20 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Negotiate Proposal for "{proposal?.track?.title}"</h2>
            <p className="text-gray-400">
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
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-center font-medium">{error}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto mb-6 space-y-4">
          {messages.map((msg, index) => {
            const isLastMessage = index === messages.length - 1;
            const isCounterOffer = !!(msg.counter_offer || msg.counter_terms);
            const isFromOtherParty = msg.sender.email !== user?.email;

            return (
              <div
                key={msg.id}
                className={`p-4 rounded-lg ${
                  msg.sender.email === user?.email
                    ? 'bg-purple-900/20 ml-8'
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
                {msg.counter_terms && (
                  <p className="text-blue-400">
                    Proposed Terms: {msg.counter_terms}
                  </p>
                )}

                {isLastMessage && isCounterOffer && isFromOtherParty && (
                  <div className="mt-4 flex items-center space-x-4 border-t border-white/10 pt-3">
                    <button
                      onClick={() => handleCounterResponse('accept', msg.id)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors font-semibold"
                      disabled={loading}
                    >
                      Accept Counter
                    </button>
                    <button
                      onClick={() => handleCounterResponse('decline', msg.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors font-semibold"
                      disabled={loading}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full"
              placeholder="Enter your message..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full pl-10"
                  placeholder="0.00"
                  step="0.01"
                  defaultValue={proposal?.sync_fee?.toString()}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Proposed Terms (Optional)
              </label>
              <input
                type="text"
                value={counterTerms}
                onChange={(e) => setCounterTerms(e.target.value)}
                className="w-full"
                placeholder="e.g., Net 30, 2-year license"
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
