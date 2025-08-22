import React, { useState } from 'react';
import { X, Check, AlertTriangle, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { createCheckoutSession } from '../lib/stripe';

interface SyncProposalAcceptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: any;
  onAccept: () => void;
}

export function SyncProposalAcceptDialog({
  isOpen,
  onClose,
  proposal,
  onAccept
}: SyncProposalAcceptDialogProps) {
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
        // Create a checkout session for the sync fee
        const checkoutUrl = await createCheckoutSession(
          'price_custom',
          'payment',
          undefined,
          {
            proposal_id: proposal.id,
            amount: Math.round(proposal.sync_fee * 100),
            description: `Sync license for "${proposal.track.title}"`,
            payment_terms: proposal.payment_terms || 'immediate'
          },
          `${window.location.origin}/sync-proposal/success?session_id={CHECKOUT_SESSION_ID}&proposal_id=${proposal.id}`
        );
        // Redirect to checkout
        window.location.href = checkoutUrl;
      } else {
        // Show waiting message
        setWaitingMessage('Your acceptance has been recorded. Waiting for the producer to accept the proposal. You will be notified when payment is ready.');
        // Update UI state instead of reloading
        onAccept();
      }
    } catch (err) {
      console.error('Error accepting proposal:', err);
      // Check if this is a case where the client accepted but producer hasn't
      if (err instanceof Error && err.message.includes('producer')) {
        setWaitingMessage('Your acceptance has been recorded. Waiting for the producer to accept the proposal. You will be notified when payment is ready.');
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

      // Update proposal status to client_rejected
      const { error: updateError } = await supabase
        .from('sync_proposals')
        .update({ 
          client_status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', proposal.id);

      if (updateError) throw updateError;

      // Create history entry
      const { error: historyError } = await supabase
        .from('proposal_history')
        .insert({
          proposal_id: proposal.id,
          previous_status: 'pending_client',
          new_status: 'rejected',
          changed_by: user.id
        });

      if (historyError) throw historyError;

      // Get producer email for notification
      const { data: producerData, error: producerError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', proposal.track.producer.id)
        .single();

      if (producerError) throw producerError;

      // Send notification to producer
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-proposal-update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proposalId: proposal.id,
          action: 'client_reject',
          trackTitle: proposal.track.title,
          producerEmail: producerData.email
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-purple-500/20 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Accept Proposal</h2>
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
              The producer has accepted your proposal for "{proposal.track.title}". Please review the details below.
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Track:</span>
                <span className="text-white font-medium">{proposal.track.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Producer:</span>
                <span className="text-white font-medium">
                  {proposal.track.producer.first_name} {proposal.track.producer.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sync Fee:</span>
                <span className="text-green-400 font-semibold">${proposal.sync_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Payment Terms:</span>
                <span className="text-white">{formatPaymentTerms(proposal.payment_terms || 'immediate')}</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-400 text-sm">
                By accepting this proposal, you agree to pay the sync fee according to the payment terms. 
                You will be redirected to a secure payment page to complete this transaction.
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
                  Accept & Proceed to Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
