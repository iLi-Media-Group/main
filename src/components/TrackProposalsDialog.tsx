import React, { useState, useEffect } from 'react';
import { X, Clock, DollarSign, Calendar, CheckCircle, XCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { ProposalNegotiationDialog } from './ProposalNegotiationDialog';
import { ProposalHistoryDialog } from './ProposalHistoryDialog';
import { ProposalConfirmDialog } from './ProposalConfirmDialog';

interface TrackProposalsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  trackTitle: string;
}

interface SyncProposal {
  id: string;
  project_type: string;
  sync_fee: number;
  expiration_date: string;
  is_urgent: boolean;
  status: string;
  created_at: string;
  client: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export function TrackProposalsDialog({
  isOpen,
  onClose,
  trackId,
  trackTitle
}: TrackProposalsDialogProps) {
  const { user } = useUnifiedAuth();
  const [proposals, setProposals] = useState<SyncProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<SyncProposal | null>(null);
  const [showNegotiationDialog, setShowNegotiationDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'reject'>('accept');
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'expired'>('all');

  useEffect(() => {
    if (isOpen && trackId) {
      fetchProposals();
    }
  }, [isOpen, trackId, filter]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('sync_proposals')
        .select(`
          id,
          project_type,
          sync_fee,
          expiration_date,
          is_urgent,
          status,
          created_at,
          client:profiles!client_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('track_id', trackId)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (data) setProposals(data);
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleProposalAction = (proposal: SyncProposal, action: 'negotiate' | 'history' | 'accept' | 'reject') => {
    setSelectedProposal(proposal);
    
    switch (action) {
      case 'negotiate':
        setShowNegotiationDialog(true);
        break;
      case 'history':
        setShowHistoryDialog(true);
        break;
      case 'accept':
        setConfirmAction('accept');
        setShowConfirmDialog(true);
        break;
      case 'reject':
        setConfirmAction('reject');
        setShowConfirmDialog(true);
        break;
    }
  };

  const handleProposalStatusChange = async (action: 'accept' | 'reject') => {
    if (!selectedProposal || !user) return;
    
    try {
      // Update proposal status
      const { error } = await supabase
        .from('sync_proposals')
        .update({ 
          status: action === 'accept' ? 'accepted' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProposal.id);

      if (error) throw error;

      // Create history entry
      const { error: historyError } = await supabase
        .from('proposal_history')
        .insert({
          proposal_id: selectedProposal.id,
          previous_status: 'pending',
          new_status: action === 'accept' ? 'accepted' : 'rejected',
          changed_by: user.id
        });

      if (historyError) throw historyError;

      // Send notification to client
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-proposal-update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proposalId: selectedProposal.id,
          action,
          trackTitle,
          clientEmail: selectedProposal.client.email
        })
      });

      // Update local state
      setProposals(proposals.map(p => 
        p.id === selectedProposal.id 
          ? { ...p, status: action === 'accept' ? 'accepted' : 'rejected' } 
          : p
      ));
      
      setShowConfirmDialog(false);
      setSelectedProposal(null);
    } catch (err) {
      console.error(`Error ${action}ing proposal:`, err);
      throw err;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Pending</span>;
      case 'accepted':
        return <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">Accepted</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">Rejected</span>;
      case 'expired':
        return <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full text-xs">Expired</span>;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-blue-900/90 backdrop-blur-md p-6 rounded-xl border border-purple-500/20 w-full max-w-4xl max-h-[95vh] flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-white">Proposals for "{trackTitle}"</h2>
              <p className="text-gray-400 text-sm">View and manage all sync proposals for this track</p>
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

          {loading ? (
            <div className="flex items-center justify-center py-12 flex-1">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 min-h-0">
              {proposals.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No proposals found for this track</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {proposals.map((proposal) => {
                    const getStatusBadge = (status: string) => {
                      switch (status) {
                        case 'accepted':
                          return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">Accepted</span>;
                        case 'rejected':
                          return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-sm">Rejected</span>;
                        case 'expired':
                          return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm">Expired</span>;
                        case 'pending':
                          return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">Pending</span>;
                        default:
                          return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-sm">{status}</span>;
                      }
                    };

                    return (
                      <div key={proposal.id} className="bg-white/5 rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="text-lg font-semibold text-white">
                                {proposal.project_type}
                              </h3>
                              {getStatusBadge(proposal.status)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Client:</span>
                                <p className="text-white">
                                  {proposal.client.first_name} {proposal.client.last_name}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-400">Sync Fee:</span>
                                <p className="text-white font-semibold">${proposal.sync_fee.toFixed(2)}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Submitted:</span>
                                <p className="text-white">
                                  {new Date(proposal.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <p className="text-gray-300 mt-2 text-sm">
                              {proposal.project_type}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button 
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                              onClick={() => {
                                setSelectedProposal(proposal);
                                setShowHistoryDialog(true);
                              }}
                            >
                              History
                            </button>
                            {proposal.status === 'pending' && (
                              <>
                                <button 
                                  className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                                  onClick={() => {
                                    setSelectedProposal(proposal);
                                    setShowNegotiationDialog(true);
                                  }}
                                >
                                  Negotiate
                                </button>
                                <button 
                                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                  onClick={() => {
                                    setSelectedProposal(proposal);
                                    setConfirmAction('accept');
                                    setShowConfirmDialog(true);
                                  }}
                                >
                                  Accept
                                </button>
                                <button 
                                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                  onClick={() => {
                                    setSelectedProposal(proposal);
                                    setConfirmAction('reject');
                                    setShowConfirmDialog(true);
                                  }}
                                >
                                  Decline
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nested Dialogs */}
      {selectedProposal && showNegotiationDialog && (
        <ProposalNegotiationDialog
          isOpen={showNegotiationDialog}
          onClose={() => {
            setShowNegotiationDialog(false);
            setSelectedProposal(null);
            fetchProposals(); // Refresh proposals after negotiation
          }}
          proposal={selectedProposal}
          onNegotiationSent={() => {
            setShowNegotiationDialog(false);
            setSelectedProposal(null);
            fetchProposals();
          }}
        />
      )}

      {selectedProposal && showHistoryDialog && (
        <ProposalHistoryDialog
          isOpen={showHistoryDialog}
          onClose={() => {
            setShowHistoryDialog(false);
            setSelectedProposal(null);
          }}
          proposal={selectedProposal}
        />
      )}

      {selectedProposal && showConfirmDialog && (
        <ProposalConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => {
            setShowConfirmDialog(false);
            setSelectedProposal(null);
          }}
          onConfirm={() => handleProposalStatusChange(confirmAction)}
          action={confirmAction}
          proposal={selectedProposal}
        />
      )}
    </>
  );
}
