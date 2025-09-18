import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, XCircle, DollarSign, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';

interface Proposal {
  id: string;
  sync_fee: number;
  payment_terms: string;
  negotiated_amount?: number;
  negotiated_payment_terms?: string;
  track?: {
    title: string;
    producer: {
      first_name: string;
      last_name: string;
    };
  };
  project_title?: string;
  project_description?: string;
}

interface NegotiationAcceptanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal;
  isSyncProposal: boolean;
  onAccept: () => void;
}

type AcceptanceStatus = 'pending' | 'accepted' | 'waiting';

interface InvoiceDetails {
  amount: number;
  payment_terms: string;
  dueDate: string;
  invoiceUrl: string;
}

export function NegotiationAcceptanceDialog({
  isOpen,
  onClose,
  proposal,
  isSyncProposal,
  onAccept
}: NegotiationAcceptanceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invoiceCreated, setInvoiceCreated] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails | null>(null);
  const [acceptanceStatus, setAcceptanceStatus] = useState<AcceptanceStatus>('pending');
  const [waitingMessage, setWaitingMessage] = useState('');
  
  const { user } = useUnifiedAuth();

  if (!isOpen) return null;

  const hasNegotiation = proposal.negotiated_amount || proposal.negotiated_payment_terms;
  const finalAmount = proposal.negotiated_amount || proposal.sync_fee;
  const finalPaymentTerms = proposal.negotiated_payment_terms || proposal.payment_terms;

  const formatPaymentTerms = (terms: string): string => {
    const termMap: Record<string, string> = {
      immediate: 'Due immediately',
      net30: 'Due in 30 days',
      net60: 'Due in 60 days',
      net90: 'Due in 90 days'
    };
    return termMap[terms] || terms;
  };

  const calculateDueDate = (paymentTerms: string): Date => {
    const today = new Date();
    const dayMap: Record<string, number> = {
      net30: 30,
      net60: 60,
      net90: 90
    };
    
    const days = dayMap[paymentTerms] || 0;
    return new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  };

  const createCheckoutSession = async (
    priceId: string,
    mode: 'payment' | 'subscription',
    customData?: any,
    customSuccessUrl?: string
  ): Promise<string> => {
    // For sync proposals, use stripe-invoice endpoint instead of stripe-checkout
    if (customData?.proposal_id) {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-invoice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proposal_id: customData.proposal_id,
          amount: customData.amount,
          client_user_id: user?.id,
          payment_terms: customData.payment_terms || 'immediate',
          metadata: {
            description: customData.description,
            payment_terms: customData.payment_terms || 'immediate'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment session');
      }

      const { url } = await response.json();
      return url;
    } else {
      // For non-sync proposals, use the original stripe-checkout endpoint
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          price_id: priceId,
          mode,
          success_url: customSuccessUrl || `${window.location.origin}/dashboard`,
          cancel_url: `${window.location.origin}/dashboard`,
          metadata: customData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      return url;
    }
  };

  const createInvoice = async (
    proposalId: string,
    amount: number,
    paymentTerms: string,
    isSyncProposal: boolean
  ): Promise<any> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('You must be logged in to make a payment');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        proposal_id: proposalId,
        amount: Math.round(amount * 100),
        client_user_id: user?.id,
        payment_terms: paymentTerms,
        is_sync_proposal: isSyncProposal,
        metadata: {
          description: isSyncProposal 
            ? `Sync license for "${proposal.track?.title}"`
            : `Custom sync: "${proposal.project_title}"`,
          payment_terms: paymentTerms
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create invoice');
    }

    return response.json();
  };

  const handleAccept = async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');

      // Call the database function to handle acceptance
      const { error: dbError } = await supabase
        .rpc('handle_negotiation_acceptance', {
          proposal_id: proposal.id,
          is_sync_proposal: isSyncProposal
        });

      if (dbError) throw dbError;

      // Fetch the updated proposal to check the new status
      const { data: updatedProposal, error: fetchError } = await supabase
        .from('sync_proposals')
        .select('status, client_status, producer_status, negotiation_status')
        .eq('id', proposal.id)
        .single();

      if (fetchError) throw fetchError;

      // Check if both parties have accepted (status = 'accepted')
      if (updatedProposal.status === 'accepted') {
        // Both parties have accepted - trigger payment flow
        if (finalPaymentTerms === 'immediate') {
          const checkoutUrl = await createCheckoutSession(
            'price_custom',
            'payment',
            {
              proposal_id: proposal.id,
              amount: Math.round(finalAmount * 100),
              description: isSyncProposal 
                ? `Sync license for "${proposal.track?.title}"`
                : `Custom sync: "${proposal.project_title}"`,
              payment_terms: finalPaymentTerms,
              is_sync_proposal: isSyncProposal
            },
            isSyncProposal 
              ? `${window.location.origin}/sync-proposal/success?session_id={CHECKOUT_SESSION_ID}&proposal_id=${proposal.id}`
              : undefined
          );
          window.location.href = checkoutUrl;
        } else {
          // For net payment terms, create invoice
          const invoiceResult = await createInvoice(proposal.id, finalAmount, finalPaymentTerms, isSyncProposal);
          
          if (invoiceResult.type === 'invoice') {
            setInvoiceDetails(invoiceResult);
            setInvoiceCreated(true);
          } else if (invoiceResult.type === 'checkout') {
            window.location.href = invoiceResult.url;
          }
        }
      } else {
        // Only one party has accepted - show pending message
        if (updatedProposal.client_status === 'accepted' && updatedProposal.producer_status !== 'accepted') {
          setAcceptanceStatus('waiting');
          setWaitingMessage('Your acceptance has been recorded. Waiting for the producer to accept the proposal.');
        } else if (updatedProposal.producer_status === 'accepted' && updatedProposal.client_status !== 'accepted') {
          setAcceptanceStatus('waiting');
          setWaitingMessage('Producer has accepted. Waiting for client acceptance.');
        }
        onAccept();
      }

      onAccept();
    } catch (err) {
      console.error('Error accepting negotiation:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept negotiation');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');

      const { error: dbError } = await supabase
        .rpc('handle_negotiation_rejection', {
          proposal_id: proposal.id,
          is_sync_proposal: isSyncProposal
        });

      if (dbError) throw dbError;

      onClose();
    } catch (err) {
      console.error('Error declining negotiation:', err);
      setError(err instanceof Error ? err.message : 'Failed to decline negotiation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (): void => {
    setInvoiceCreated(false);
    setInvoiceDetails(null);
    setAcceptanceStatus('pending');
    setWaitingMessage('');
    onClose();
  };

  const renderProjectDetails = () => (
    <div className="bg-white/5 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-2">Project Details</h3>
      {isSyncProposal ? (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Track:</span>
            <span className="text-white font-medium">{proposal.track?.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Producer:</span>
            <span className="text-white font-medium">
              {proposal.track?.producer.first_name} {proposal.track?.producer.last_name}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Project:</span>
            <span className="text-white font-medium">{proposal.project_title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Description:</span>
            <span className="text-white font-medium">{proposal.project_description}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderTermsComparison = () => (
    <div className="space-y-4">
      {/* Original Terms */}
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-md font-semibold text-gray-300 mb-3">Original Offer</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Amount:</span>
            <span className="text-white">${proposal.sync_fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Payment Terms:</span>
            <span className="text-white">{formatPaymentTerms(proposal.payment_terms)}</span>
          </div>
        </div>
      </div>

      {/* Negotiated Terms */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <h4 className="text-md font-semibold text-green-400 mb-3">Negotiated Terms</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Amount:</span>
            <span className="text-green-400 font-semibold">${finalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Payment Terms:</span>
            <span className="text-green-400 font-semibold">{formatPaymentTerms(finalPaymentTerms)}</span>
          </div>
          {finalPaymentTerms !== 'immediate' && (
            <div className="flex justify-between">
              <span className="text-gray-400">Due Date:</span>
              <span className="text-yellow-400 font-semibold">
                {calculateDueDate(finalPaymentTerms).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderChangesSummary = () => {
    if (!hasNegotiation) return null;

    return (
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-md font-semibold text-blue-400 mb-2">Changes Made</h4>
        <div className="space-y-1 text-sm">
          {proposal.negotiated_amount && proposal.negotiated_amount !== proposal.sync_fee && (
            <p className="text-blue-300">
              • Amount changed from ${proposal.sync_fee.toFixed(2)} to ${proposal.negotiated_amount.toFixed(2)}
            </p>
          )}
          {proposal.negotiated_payment_terms && proposal.negotiated_payment_terms !== proposal.payment_terms && (
            <p className="text-blue-300">
              • Payment terms changed from {formatPaymentTerms(proposal.payment_terms)} to {formatPaymentTerms(proposal.negotiated_payment_terms)}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderPaymentInfo = () => (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
      <div className="flex items-start space-x-2">
        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="text-yellow-400 text-sm">
          {finalPaymentTerms === 'immediate' ? (
            <p>By accepting these terms, you will be redirected to a secure payment page to complete the transaction immediately.</p>
          ) : (
            <p>By accepting these terms, an invoice will be created with a due date of {calculateDueDate(finalPaymentTerms).toLocaleDateString()}. You can pay anytime before the due date.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderInvoiceSuccess = () => {
    if (!invoiceCreated || !invoiceDetails) return null;

    return (
      <div className="space-y-6">
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
          <Check className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-400 mb-2">Invoice Created Successfully!</h3>
          <p className="text-green-300 mb-4">
            Your invoice has been created and sent to your email address.
          </p>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-3">Invoice Details</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Amount:</span>
              <span className="text-white font-semibold">${(invoiceDetails.amount / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Payment Terms:</span>
              <span className="text-white font-semibold">{formatPaymentTerms(invoiceDetails.payment_terms)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Due Date:</span>
              <span className="text-yellow-400 font-semibold">
                {new Date(invoiceDetails.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-blue-300 text-sm">
              <p>You will receive an email with payment instructions. You can also pay directly using the button below.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <a
            href={invoiceDetails.invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
          >
            <DollarSign className="w-5 h-5 mr-2" />
            Pay Invoice Now
          </a>
        </div>
      </div>
    );
  };

  const renderWaitingStatus = () => (
    <div className="space-y-6">
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 text-center">
        <Calendar className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-yellow-400 mb-2">Waiting for Acceptance</h3>
        <p className="text-yellow-300 mb-4">
          {waitingMessage}
        </p>
      </div>

      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-white mb-3">Proposal Status</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Your Acceptance:</span>
            <span className="text-green-400 font-semibold">✓ Recorded</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Other Party:</span>
            <span className="text-yellow-400 font-semibold">Pending</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-blue-300 text-sm">
            <p>You will be notified when the other party accepts the proposal. Payment will be processed once both parties agree.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActionButtons = () => {
    if (invoiceCreated) {
      return (
        <button
          onClick={handleClose}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
        >
          <Check className="w-5 h-5 mr-2" />
          Done
        </button>
      );
    }

    if (acceptanceStatus === 'waiting') {
      return (
        <button
          onClick={handleClose}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
        >
          <X className="w-5 h-5 mr-2" />
          Close
        </button>
      );
    }

    return (
      <>
        <button
          onClick={handleDecline}
          className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 rounded-lg transition-colors flex items-center"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 mr-2" />
              Decline
            </>
          )}
        </button>
        <button
          onClick={handleAccept}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Accept Terms
            </>
          )}
        </button>
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-blue-900/90 backdrop-blur-md p-6 rounded-xl border border-purple-500/20 w-full max-w-xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Review Negotiated Terms</h2>
          <button
            onClick={handleClose}
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

        <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
          {invoiceCreated ? (
            renderInvoiceSuccess()
          ) : acceptanceStatus === 'waiting' ? (
            renderWaitingStatus()
          ) : (
            <>
              {renderProjectDetails()}
              {renderTermsComparison()}
              {renderChangesSummary()}
              {renderPaymentInfo()}
            </>
          )}
        </div>

        <div className="flex justify-end space-x-4 mt-4 flex-shrink-0">
          {renderActionButtons()}
        </div>
      </div>
    </div>
  );
} 