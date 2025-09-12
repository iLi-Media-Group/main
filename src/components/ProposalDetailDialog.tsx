import React, { useState, useEffect } from 'react';
import { X, Clock, DollarSign, Calendar, CheckCircle, XCircle, AlertCircle, MessageSquare, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';

interface ProposalDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: any;
  onAccept: (proposalId: string) => void;
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

export function ProposalDetailDialog({
  isOpen,
  onClose,
  proposal,
  onAccept
}: ProposalDetailDialogProps) {
  const { user } = useUnifiedAuth();
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && proposal) {
      fetchNegotiationMessages();
    }
  }, [isOpen, proposal]);

  const fetchNegotiationMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch negotiation messages
      const { data: messagesData, error: messagesError } = await supabase
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

      if (messagesError) throw messagesError;

      setMessages(messagesData || []);
    } catch (err) {
      console.error('Error fetching negotiation messages:', err);
      setError('Failed to load negotiation history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, clientStatus: string, paymentStatus: string) => {
    // Producer status
    if (status === 'accepted') {
      // Check client status
      if (clientStatus === 'pending') {
        return <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Awaiting Your Acceptance</span>;
      } else if (clientStatus === 'accepted') {
        // Check payment status
        if (paymentStatus === 'pending') {
          return <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Payment Pending</span>;
        } else if (paymentStatus === 'paid') {
          return <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">Completed</span>;
        }
      } else if (clientStatus === 'rejected') {
        return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">You Declined</span>;
      }
    } else if (status === 'rejected') {
      return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">Producer Declined</span>;
    } else if (status === 'pending') {
      return <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Pending Producer Review</span>;
    }
    
    return <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full text-xs">{status.toUpperCase()}</span>;
  };

  const formatPaymentTerms = (terms: string) => {
    switch (terms) {
      case 'immediate': return 'Due immediately';
      case 'net30': return 'Due in 30 days';
      case 'net60': return 'Due in 60 days';
      case 'net90': return 'Due in 90 days';
      default: return terms;
    }
  };

  const canAccept = proposal && 
                    proposal.status === 'accepted' && 
                    proposal.client_status === 'pending' &&
                    new Date(proposal.expiration_date) > new Date();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-blue-900/90 backdrop-blur-md p-6 rounded-xl border border-purple-500/20 w-full max-w-3xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Proposal Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex-shrink-0">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {proposal ? (
          <div className="space-y-6 overflow-y-auto flex-1 min-h-0">
            {/* Track Information */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Track Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400">Title:</span>
                  <p className="text-white font-medium">{proposal.track?.title}</p>
                </div>
                <div>
                  <span className="text-gray-400">Producer:</span>
                  <p className="text-white font-medium">
                    {proposal.track?.producer.first_name} {proposal.track?.producer.last_name}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Genre:</span>
                  <p className="text-white">{proposal.track?.genre}</p>
                </div>
                <div>
                  <span className="text-gray-400">BPM:</span>
                  <p className="text-white">{proposal.track?.bpm}</p>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Project Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Project Title:</span>
                  <p className="text-white font-medium">{proposal.project_title}</p>
                </div>
                <div>
                  <span className="text-gray-400">Description:</span>
                  <p className="text-white">{proposal.project_description}</p>
                </div>
                <div>
                  <span className="text-gray-400">Usage:</span>
                  <p className="text-white">{proposal.usage_description}</p>
                </div>
              </div>
            </div>

            {/* Terms and Pricing */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Terms & Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400">Sync Fee:</span>
                  <p className="text-white font-semibold text-lg">${proposal.sync_fee.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Payment Terms:</span>
                  <p className="text-white">{proposal.payment_terms}</p>
                </div>
                <div>
                  <span className="text-gray-400">Exclusivity:</span>
                  <p className="text-white">{proposal.is_exclusive ? 'Exclusive' : 'Non-exclusive'}</p>
                </div>
                <div>
                  <span className="text-gray-400">License Duration:</span>
                  <p className="text-white">{proposal.license_duration}</p>
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400">Name:</span>
                  <p className="text-white font-medium">
                    {proposal.client.first_name} {proposal.client.last_name}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Email:</span>
                  <p className="text-white">{proposal.client.email}</p>
                </div>
                <div>
                  <span className="text-gray-400">Company:</span>
                  <p className="text-white">{proposal.client.company || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    proposal.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                    proposal.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    proposal.status === 'expired' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {proposal.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Negotiation History */}
            {messages.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Negotiation History</h3>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg ${
                        message.sender.email === user?.email
                          ? 'bg-purple-900/20 ml-8'
                          : 'bg-white/5 mr-8'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-gray-400">
                          {message.sender.first_name} {message.sender.last_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-white mb-2">{message.message}</p>
                      {message.counter_offer && (
                        <p className="text-green-400 font-semibold">
                          Counter Offer: ${message.counter_offer.toFixed(2)}
                        </p>
                      )}
                      {message.counter_terms && (
                        <p className="text-blue-400">
                          Proposed Terms: {message.counter_terms}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 flex-1">
            <p className="text-gray-400">Proposal not found</p>
          </div>
        )}
      </div>
    </div>
  );
}
