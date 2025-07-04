import React, { useState } from 'react';
import { X, Check, XCircle, DollarSign, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NegotiationAcceptanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: {
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
  };
  isSyncProposal: boolean;
  onAccept: () => void;
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

  if (!isOpen) return null;

  const hasNegotiation = proposal.negotiated_amount || proposal.negotiated_payment_terms;
  const finalAmount = proposal.negotiated_amount || proposal.sync_fee;
  const finalPaymentTerms = proposal.negotiated_payment_terms || proposal.payment_terms;

  const formatPaymentTerms = (terms: string) => {
    switch (terms) {
      case 'immediate': return 'Due immediately';
      case 'net30': return 'Due in 30 days';
      case 'net60': return 'Due in 60 days';
      case 'net90': return 'Due in 90 days';
      default: return terms;
    }
  };

  const calculateDueDate = (paymentTerms: string) => {
    const today = new Date();
    switch (paymentTerms) {
      case 'net30':
        return new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      case 'net60':
        return new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
      case 'net90':
        return new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
      default:
        return today;
    }
  };

  const handleAccept = async () => {
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

      // If immediate payment, trigger Stripe checkout
      if (finalPaymentTerms === 'immediate') {
        const checkoutUrl = await createCheckoutSession(
          'price_custom',
          'payment',
          undefined,
          {
            proposal_id: proposal.id,
            amount: Math.round(finalAmount * 100),
            description: isSyncProposal 
              ? `Sync license for "${proposal.track?.title}"`
              : `Custom sync: "${proposal.project_title}"`,
            payment_terms: finalPaymentTerms,
            is_sync_proposal: isSyncProposal
          }
        );
        window.location.href = checkoutUrl;
      } else {
        // For net payment terms, create invoice
        await createInvoice(proposal.id, finalAmount, finalPaymentTerms, isSyncProposal);
      }

      onAccept();
      onClose();
    } catch (err) {
      console.error('Error accepting negotiation:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept negotiation');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      setLoading(true);
      setError('');

      // Call the database function to handle rejection
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

  const createCheckoutSession = async (
    priceId: string,
    mode: 'payment' | 'subscription',
    successUrl?: string,
    metadata?: any
  ) => {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        price_id: priceId,
        mode,
        success_url: successUrl || `${window.location.origin}/dashboard`,
        cancel_url: `${window.location.origin}/dashboard`,
        metadata
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { url } = await response.json();
    return url;
  };

  const createInvoice = async (
    proposalId: string,
    amount: number,
    paymentTerms: string,
    isSyncProposal: boolean
  ) => {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-invoice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        proposal_id: proposalId,
        amount: Math.round(amount * 100),
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-blue-900/90 backdrop-blur-md p-8 rounded-xl border border-purple-500/20 w-full max-w-xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Review Negotiated Terms</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Project Details */}
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

          {/* Original vs Negotiated Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Changes Summary */}
          {hasNegotiation && (
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
          )}

          {/* Payment Information */}
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

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
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
          </div>
        </div>
      </div>
    </div>
  );
} 