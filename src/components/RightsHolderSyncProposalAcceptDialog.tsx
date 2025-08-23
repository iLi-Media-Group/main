import React, { useState } from 'react';
import { X, Check, AlertTriangle, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { createCheckoutSession } from '../lib/stripe';

interface RightsHolderSyncProposalAcceptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: any;
  onAccept: () => void;
}

export function RightsHolderSyncProposalAcceptDialog({
  isOpen,
  onClose,
  proposal,
  onAccept
}: RightsHolderSyncProposalAcceptDialogProps) {
  const { user } = useUnifiedAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [waitingMessage, setWaitingMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAccept = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      setWaitingMessage(null);

      // Call the backend RPC to finalize negotiation acceptance
      const { error: rpcError } = await supabase.rpc('handle_negotiation_acceptance', {
        proposal_id: proposal.id,
        is_sync_proposal: true
      });
      if (rpcError) throw rpcError;

      // Fetch the updated proposal to check the new status
      const { data: updatedProposal, error: fetchError } = await supabase
        .from('sync_proposals')
        .select('status, client_status, producer_status, negotiation_status, sync_fee, payment_terms, track(title)')
        .eq('id', proposal.id)
        .single();
      if (fetchError) throw fetchError;

      // Optionally, refresh proposals in parent/dashboard
      onAccept();

      // Only redirect to Stripe if both parties have accepted
      if (updatedProposal.status === 'accepted') {
        // Use stripe-invoice endpoint for sync proposal payments (handles real customers)
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
            proposal_id: proposal.id,
            amount: Math.round(proposal.sync_fee * 100),
            client_user_id: user?.id,
            payment_terms: proposal.payment_terms || 'immediate',
            metadata: {
              description: `Sync license for "${proposal.track.title}"`,
              payment_terms: proposal.payment_terms || 'immediate'
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create payment session');
        }

        const { url } = await response.json();
        window.location.href = url;
      } else {
        // Show waiting message
        setWaitingMessage('Your acceptance has been recorded. Waiting for the client to accept the proposal. You will be notified when payment is ready.');
        // Update UI state instead of reloading
        onAccept();
      }
    } catch (err) {
      console.error('Error accepting proposal:', err);
      // Check if this is a case where the rights holder accepted but client hasn't
      if (err instanceof Error && err.message.includes('client')) {
        setWaitingMessage('Your acceptance has been recorded. Waiting for the client to accept the proposal. You will be notified when payment is ready.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to accept proposal. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      // Update proposal status to producer_rejected
      const { error: updateError } = await supabase
        .from('sync_proposals')
        .update({ 
          producer_status: 'rejected',
          status: 'rejected',
          negotiation_status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', proposal.id);

      if (updateError) throw updateError;

      // Create history entry
      const { error: historyError } = await supabase
        .from('proposal_history')
        .insert({
          proposal_id: proposal.id,
          previous_status: 'pending_producer',
          new_status: 'rejected',
          changed_by: user.id
        });

      if (historyError) throw historyError;

      // Get client email for notification
      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', proposal.client_id)
        .single();

      if (clientError) throw clientError;

      // Send notification to client
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-proposal-update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proposalId: proposal.id,
          action: 'producer_reject',
          trackTitle: proposal.track.title,
          clientEmail: clientData.email
        })
      });

      onClose();
      // Update UI state instead of reloading
      onAccept();
    } catch (err) {
      console.error('Error declining proposal:', err);
      setError(err instanceof Error ? err.message : 'Failed to decline proposal');
    } finally {
      setLoading(false);
    }
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

  const getFinalAmount = () => {
    return proposal.negotiated_amount || proposal.sync_fee;
  };

  const getFinalPaymentTerms = () => {
    return proposal.negotiated_payment_terms || proposal.payment_terms || 'immediate';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-purple-500/20 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Finalize Proposal</h2>
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

        {waitingMessage && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-400 text-center">{waitingMessage}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Proposal Details</h3>
            <p className="text-gray-300 mb-4">
              Both parties have accepted the proposal for "{proposal.track.title}". Please review the final details below.
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Track:</span>
                <span className="text-white font-medium">{proposal.track.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Client:</span>
                <span className="text-white font-medium">
                  {proposal.client.first_name} {proposal.client.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Final Amount:</span>
                <span className="text-green-400 font-semibold">${getFinalAmount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Payment Terms:</span>
                <span className="text-white">{formatPaymentTerms(getFinalPaymentTerms())}</span>
              </div>
              {proposal.negotiated_amount && proposal.negotiated_amount !== proposal.sync_fee && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Original Amount:</span>
                  <span className="text-gray-400 line-through">${proposal.sync_fee.toFixed(2)}</span>
                </div>
              )}
              {proposal.negotiated_payment_terms && proposal.negotiated_payment_terms !== proposal.payment_terms && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Original Terms:</span>
                  <span className="text-gray-400 line-through">{formatPaymentTerms(proposal.payment_terms)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-400 text-sm">
                The client has accepted this proposal. You can now proceed to receive payment for this sync license.
              </p>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-400 text-sm">
                By finalizing this proposal, you agree to the terms and will receive payment according to the payment terms. 
                The client will be redirected to a secure payment page to complete this transaction.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={handleDecline}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 rounded-lg transition-colors flex items-center"
              disabled={loading}
            >
              Decline
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
                  Finalize & Process Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
