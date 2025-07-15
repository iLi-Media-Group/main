import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, Tag, Clock, Hash, FileMusic, Layers, Mic, Star, X, Calendar, ArrowUpDown, AlertCircle, DollarSign, Edit, Check, Trash2, Plus, UserCog, Loader2, BarChart3, FileText, MessageSquare, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { parseArrayField } from '../lib/utils';
import { AudioPlayer } from './AudioPlayer';
import { DeleteTrackDialog } from './DeleteTrackDialog';
import { TrackProposalsDialog } from './TrackProposalsDialog';
import { RevenueBreakdownDialog } from './RevenueBreakdownDialog';
import { ProposalNegotiationDialog } from './ProposalNegotiationDialog';
import { ProposalHistoryDialog } from './ProposalHistoryDialog';
import { ProposalConfirmDialog } from './ProposalConfirmDialog';
import { ProducerProfile } from './ProducerProfile';
import { EditTrackModal } from './EditTrackModal';
import { SyncRequestChatModal } from './SyncRequestChatModal';

interface Track {
  id: string;
  title: string;
  genres: string[];
  moods?: string[];
  mediaUsage?: string[];
  bpm: number;
  audio_url: string;
  image_url: string;
  created_at: string;
  has_vocals: boolean;
  vocals_usage_type: string | null;
  sales_count: number;
  revenue: number;
}

interface Proposal {
  id: string;
  project_type: string;
  sync_fee: number;
  expiration_date: string;
  is_urgent: boolean;
  status: string;
  producer_status?: string;
  client_status?: string;
  updated_at?: string;
  last_message_sender_id?: string;
  last_message_at?: string;
  created_at: string;
  client: {
    first_name: string;
    last_name: string;
    email: string;
  };
  track: {
    id: string;
    title: string;
  };
  final_amount?: number;
  negotiated_amount?: number;
  payment_terms?: string;
  final_payment_terms?: string;
  negotiated_payment_terms?: string;
  negotiation_status?: string;
  client_accepted_at?: string;
  payment_status?: string; // Added for paid sync proposals
}

// Add a helper to determine if a proposal has a pending action
function hasPendingAction(proposal: Proposal, userId: string): boolean {
  // Show badge if proposal has a message from someone else that hasn't been responded to
  const hasNewMessage = !!(
    proposal.last_message_sender_id && 
    proposal.last_message_sender_id !== userId &&
    proposal.last_message_at
  );

  // Show badge if there's a counter offer that needs acceptance
  const hasCounterOffer = proposal.negotiation_status === 'client_acceptance_required';

  // Show badge if there's a pending negotiation that requires response
  const needsResponse = proposal.negotiation_status === 'negotiating' && hasNewMessage;

  return hasNewMessage && (hasCounterOffer || needsResponse);
}

// Calculate payment due date based on payment terms and acceptance date
const calculatePaymentDueDate = (paymentTerms: string, acceptanceDate: string): Date => {
  const acceptance = new Date(acceptanceDate);
  
  switch (paymentTerms) {
    case 'immediate':
      return acceptance; // Same day
    case 'net30':
      return new Date(acceptance.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
    case 'net60':
      return new Date(acceptance.getTime() + (60 * 24 * 60 * 60 * 1000)); // 60 days
    case 'net90':
      return new Date(acceptance.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days
    default:
      return acceptance; // Default to immediate
  }
};

// Get payment terms display text
const getPaymentTermsDisplay = (paymentTerms: string): string => {
  switch (paymentTerms) {
    case 'immediate':
      return 'Immediate';
    case 'net30':
      return 'Net 30';
    case 'net60':
      return 'Net 60';
    case 'net90':
      return 'Net 90';
    default:
      return 'Immediate';
  }
};

export function ProducerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [pendingProposals, setPendingProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState<'created_at' | 'title' | 'bpm'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [profile, setProfile] = useState<{ first_name?: string, email: string } | null>(null);
  const [stats, setStats] = useState({
    totalTracks: 0,
    totalSales: 0,
    totalRevenue: 0,
    pendingProposals: 0
  });
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTrackProposalsDialog, setShowTrackProposalsDialog] = useState(false);
  const [showRevenueBreakdown, setShowRevenueBreakdown] = useState(false);
  const [showNegotiationDialog, setShowNegotiationDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'reject'>('accept');
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showEditTrackModal, setShowEditTrackModal] = useState(false);
  const [proposalsTab, setProposalsTab] = useState<'pending' | 'accepted' | 'paid' | 'declined'>('pending');
  const [openSyncRequests, setOpenSyncRequests] = useState<any[]>([]);
  const [syncSubmissions, setSyncSubmissions] = useState<any[]>([]);
  const [submissionLoading, setSubmissionLoading] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionFields, setSubmissionFields] = useState<{ [id: string]: { trackUrl: string; notes: string } }>({});
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  // Add state for filetype checkboxes in the submission form
  const [filetypeFields, setFiletypeFields] = useState<{ [reqId: string]: { has_mp3: boolean; has_stems: boolean; has_trackouts: boolean } }>({});
  // Add state for editing filetypes
  const [editingFiletypes, setEditingFiletypes] = useState<{ [reqId: string]: boolean }>({});
  const [editFiletypeFields, setEditFiletypeFields] = useState<{ [reqId: string]: { has_mp3: boolean; has_stems: boolean; has_trackouts: boolean } }>({});
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSubmission, setChatSubmission] = useState<{ syncRequestId: string; submissionId: string } | null>(null);

  // Fetch open custom sync requests and existing submissions
  useEffect(() => {
    if (!user) return;
    const fetchOpenSyncRequests = async () => {
      const { data: requests, error: reqError } = await supabase
        .from('custom_sync_requests')
        .select('*')
        .eq('status', 'open')
        .gte('end_date', new Date().toISOString());
      if (!reqError) setOpenSyncRequests(requests || []);
      // Fetch submissions by this producer
      const { data: submissions, error: subError } = await supabase
        .from('sync_submissions')
        .select('sync_request_id, has_mp3, has_stems, has_trackouts')
        .eq('producer_id', user.id);
      if (!subError) setSyncSubmissions(submissions || []);
    };
    fetchOpenSyncRequests();
  }, [user, submissionSuccess]);

  // Helper to check if already submitted
  const hasSubmitted = (syncRequestId: string) =>
    syncSubmissions.some((s) => s.sync_request_id === syncRequestId);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (profileData) {
        setProfile(profileData);
      }

      // Fetch tracks with sales data
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          genres,
          moods,
          media_usage,
          bpm,
          audio_url,
          image_url,
          created_at,
          has_vocals,
          vocals_usage_type
        `)
        .eq('track_producer_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (tracksError) throw tracksError;

      // Fetch sales data for each track
      const trackIds = tracksData?.map(track => track.id) || [];
      
      // Get sales data for all tracks at once
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('track_id, amount')
        .in('track_id', trackIds)
        .is('deleted_at', null);

      if (salesError) throw salesError;

      // Process sales data by track
      const trackSalesMap: Record<string, number> = {};
      const trackRevenueMap: Record<string, number> = {};
      
      if (salesData) {
        salesData.forEach(sale => {
          if (!trackSalesMap[sale.track_id]) {
            trackSalesMap[sale.track_id] = 0;
            trackRevenueMap[sale.track_id] = 0;
          }
          trackSalesMap[sale.track_id]++;
          trackRevenueMap[sale.track_id] += sale.amount;
        });
      }



      // Add sales data to tracks
      const tracksWithSales = tracksData?.map(track => ({
        ...track,
        genres: parseArrayField(track.genres),
        moods: parseArrayField(track.moods),
        mediaUsage: parseArrayField(track.media_usage),
        sales_count: trackSalesMap[track.id] || 0,
        revenue: trackRevenueMap[track.id] || 0
      })) || [];

      setTracks(tracksWithSales);

      // Calculate total stats from track sales only
      const totalTracks = tracksWithSales.length;
      const trackSalesCount = Object.values(trackSalesMap).reduce((sum: number, count: number) => sum + count, 0);
      const trackSalesRevenue = Object.values(trackRevenueMap).reduce((sum: number, amount: number) => sum + amount, 0);

      // Fetch paid sync proposals for this producer's tracks
      const { data: paidSyncProposals, error: syncProposalsError } = await supabase
        .from('sync_proposals')
        .select('id, sync_fee, final_amount, negotiated_amount, payment_status')
        .in('track_id', trackIds)
        .eq('payment_status', 'paid')
        .eq('status', 'accepted');

      if (syncProposalsError) throw syncProposalsError;

      // Fetch completed custom sync requests where this producer is the preferred producer
      const { data: completedCustomSyncRequests, error: customSyncError } = await supabase
        .from('custom_sync_requests')
        .select('id, sync_fee, final_amount, negotiated_amount')
        .eq('preferred_producer_id', user.id)
        .eq('status', 'completed');

      if (customSyncError) throw customSyncError;

      // Calculate comprehensive totals including all revenue streams
      const syncProposalsCount = paidSyncProposals?.length || 0;
      const syncProposalsRevenue = paidSyncProposals?.reduce((sum, proposal) => sum + (proposal.final_amount || proposal.negotiated_amount || proposal.sync_fee || 0), 0) || 0;
      
      const customSyncCount = completedCustomSyncRequests?.length || 0;
      const customSyncRevenue = completedCustomSyncRequests?.reduce((sum, request) => sum + (request.final_amount || request.negotiated_amount || request.sync_fee || 0), 0) || 0;

      const totalSales = trackSalesCount + syncProposalsCount + customSyncCount;
      const totalRevenue = trackSalesRevenue + syncProposalsRevenue + customSyncRevenue;

      // Fetch all proposals
      const { data: allProposalsData, error: allProposalsError } = await supabase
        .from('sync_proposals')
        .select(`
          id,
          track_id,
          client_id,
          project_type,
          sync_fee,
          final_amount,
          negotiated_amount,
          payment_terms,
          final_payment_terms,
          negotiated_payment_terms,
          expiration_date,
          is_urgent,
          status,
          created_at,
          updated_at,
          producer_status,
          client_status,
          negotiation_status,
          client_accepted_at,
          last_message_sender_id,
          last_message_at,
          payment_status,
          client:profiles!client_id (
            first_name,
            last_name,
            email
          ),
          track:tracks!track_id (
            id,
            title
          )
        `)
        .in('track_id', trackIds)
        .order('created_at', { ascending: false });

      if (allProposalsError) throw allProposalsError;

      // Fetch recent proposals
      const { data: recentProposalsData, error: proposalsError } = await supabase
        .from('sync_proposals')
        .select(`
          id,
          track_id,
          client_id,
          project_type,
          sync_fee,
          final_amount,
          negotiated_amount,
          payment_terms,
          final_payment_terms,
          negotiated_payment_terms,
          expiration_date,
          is_urgent,
          status,
          created_at,
          updated_at,
          producer_status,
          client_status,
          negotiation_status,
          client_accepted_at,
          last_message_sender_id,
          last_message_at,
          payment_status,
          client:profiles!client_id (
            first_name,
            last_name,
            email
          ),
          track:tracks!track_id (
            id,
            title
          )
        `)
        .in('track_id', trackIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (proposalsError) throw proposalsError;

      // Flatten client and track fields for allProposalsData
      const flattenedAllProposals = (allProposalsData || []).map((p: any) => ({
        ...p,
        client: Array.isArray(p.client) ? p.client[0] : p.client,
        track: Array.isArray(p.track) ? p.track[0] : p.track,
      }));
      // Flatten client and track fields for recentProposalsData
      const flattenedRecentProposals = (recentProposalsData || []).map((p: any) => ({
        ...p,
        client: Array.isArray(p.client) ? p.client[0] : p.client,
        track: Array.isArray(p.track) ? p.track[0] : p.track,
      }));

      setProposals(flattenedAllProposals);
      setPendingProposals(flattenedRecentProposals);

      // Calculate pending proposals count using the same filtering logic as the UI
      const pendingProposalsCount = flattenedAllProposals.filter(p => 
        (p.status === 'pending' || 
        (p.producer_status !== 'accepted' && p.producer_status !== 'rejected')) &&
        p.producer_status !== 'rejected' && 
        p.client_status !== 'rejected'
      ).length;

      // Update stats
      setStats({
        totalTracks,
        totalSales,
        totalRevenue,
        pendingProposals: pendingProposalsCount
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const confirmDeleteTrack = async () => {
    if (!selectedTrack) return;

    try {
      // Soft delete the track
      const { error } = await supabase
        .from('tracks')
        .update({
          deleted_at: new Date().toISOString()
        })
        .eq('id', selectedTrack.id);

      if (error) throw error;

      // Update local state
      setTracks(tracks.filter(track => track.id !== selectedTrack.id));
      setShowDeleteDialog(false);
      setSelectedTrack(null);
    } catch (err) {
      console.error('Error deleting track:', err);
      setError('Failed to delete track');
    }
  };

  const handleProposalAction = (proposal: Proposal, action: 'negotiate' | 'history' | 'accept' | 'reject') => {
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

  const handleProposalStatusChange = async () => {
    if (!selectedProposal || !user) return;
    
    try {
      // Update proposal producer_status
      const { error } = await supabase
        .from('sync_proposals')
        .update({ 
          producer_status: confirmAction === 'accept' ? 'accepted' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProposal.id);

      if (error) throw error;

      // Create history entry
      const { error: historyError } = await supabase
        .from('proposal_history')
        .insert({
          proposal_id: selectedProposal.id,
          previous_status: selectedProposal.producer_status || 'pending',
          new_status: confirmAction === 'accept' ? 'producer_accepted' : 'rejected',
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
          action: confirmAction,
          trackTitle: selectedProposal.track.title,
          clientEmail: selectedProposal.client.email
        })
      });

      // Update local state
      setProposals(proposals.map(p => 
        p.id === selectedProposal.id 
          ? { ...p, producer_status: confirmAction === 'accept' ? 'accepted' : 'rejected', updated_at: new Date().toISOString() } 
          : p
      ));
      
      setShowConfirmDialog(false);
      setSelectedProposal(null);
      
      // Recalculate pending proposals count after the update
      const updatedProposals = proposals.map(p => 
        p.id === selectedProposal.id 
          ? { ...p, producer_status: confirmAction === 'accept' ? 'accepted' : 'rejected', updated_at: new Date().toISOString() } 
          : p
      );
      
      const newPendingCount = updatedProposals.filter(p => 
        (p.status === 'pending' || 
        (p.producer_status !== 'accepted' && p.producer_status !== 'rejected')) &&
        p.producer_status !== 'rejected' && 
        p.client_status !== 'rejected'
      ).length;

      // Update stats to reflect the change
      setStats(prev => ({
        ...prev,
        pendingProposals: newPendingCount
      }));
    } catch (err) {
      console.error(`Error ${confirmAction}ing proposal:`, err);
      setError(`Failed to ${confirmAction} proposal`);
    }
  };

  const sortedTracks = [...tracks]
    .filter(track => !selectedGenre || track.genres.includes(selectedGenre))
    .sort((a, b) => {
      const modifier = sortOrder === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'created_at':
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * modifier;
        case 'title':
          return a.title.localeCompare(b.title) * modifier;
        case 'bpm':
          return (a.bpm - b.bpm) * modifier;
        default:
          return 0;
      }
    });

  // Tab filter logic for proposals
  const filteredPendingProposals = proposals.filter(p => 
    (p.status === 'pending' || 
    (p.producer_status !== 'accepted' && p.producer_status !== 'rejected')) &&
    p.producer_status !== 'rejected' && 
    p.client_status !== 'rejected'
  );
  const filteredAcceptedProposals = proposals.filter(p => 
    p.producer_status === 'accepted' && p.client_status === 'accepted' && p.payment_status !== 'paid'
  );
  const filteredDeclinedProposals = proposals.filter(p => 
    p.producer_status === 'rejected' || p.client_status === 'rejected'
  );
  const filteredPaidProposals = proposals.filter(
    (p) =>
      p.client_status === 'accepted' &&
      p.producer_status === 'accepted' &&
      p.payment_status === 'paid'
  );

  // Limit proposals to 5 for display with scrolling
  // const displayPendingProposals = filteredPendingProposals.slice(0, 5);
  // const displayAcceptedProposals = filteredAcceptedProposals.slice(0, 5);
  // const displayDeclinedProposals = filteredDeclinedProposals.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Producer Dashboard</h1>
            {profile && (
              <p className="text-xl text-gray-300 mt-2">
                Welcome {profile.first_name || profile.email.split('@')[0]}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowProfileDialog(true)}
              className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <UserCog className="w-5 h-5 mr-2" />
              Edit Profile
            </button>
            <Link
              to="/producer/upload"
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Upload Track
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Total Tracks</p>
                <p className="text-3xl font-bold text-white">{stats.totalTracks}</p>
              </div>
              <Music className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Total Sales</p>
                <p className="text-3xl font-bold text-white">{stats.totalSales}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20 cursor-pointer" onClick={() => setShowRevenueBreakdown(true)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Total Revenue</p>
                <p className="text-3xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Pending Proposals</p>
                <p className="text-3xl font-bold text-white">{stats.pendingProposals}</p>
              </div>
              <FileText className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
        </div>

        {user && (
  <div className="mb-12">
    <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
      <FileMusic className="w-6 h-6 mr-2 text-blue-400" />
      Open Custom Sync Requests
    </h2>
    {openSyncRequests.length === 0 ? (
      <div className="text-gray-400">No open custom sync requests at this time.</div>
    ) : (
      <>
        {/* Scrollable List */}
        <div className="max-h-64 overflow-y-auto border border-blue-500/20 rounded-lg mb-4 bg-blue-900/60">
          {openSyncRequests.map((req) => (
            <div
              key={req.id}
              className={`flex items-center justify-between px-4 py-3 border-b border-blue-500/10 cursor-pointer hover:bg-blue-800/40 ${expandedRequestId === req.id ? 'bg-blue-800/60' : ''}`}
              onClick={() => setExpandedRequestId(expandedRequestId === req.id ? null : req.id)}
            >
              <div>
                <span className="text-white font-semibold">{req.project_title}</span>
                <span className="ml-2 text-blue-300 text-xs">{req.genre}</span>
                <span className="ml-2 text-gray-400 text-xs">Deadline: {new Date(req.end_date).toLocaleDateString()}</span>
              </div>
              <button
                className="text-blue-400 hover:text-blue-200 text-sm font-semibold"
                onClick={e => { e.stopPropagation(); setExpandedRequestId(expandedRequestId === req.id ? null : req.id); }}
              >
                {expandedRequestId === req.id ? 'Hide' : 'View & Submit'}
              </button>
            </div>
          ))}
        </div>
        {/* Expanded Details & Submission Form */}
        {openSyncRequests.map((req) => {
          if (expandedRequestId !== req.id) return null;
          const trackUrl = submissionFields[req.id]?.trackUrl || '';
          const notes = submissionFields[req.id]?.notes || '';
          return (
            <div key={req.id} className="bg-blue-800/80 border border-blue-500/20 rounded-xl p-6 mb-6">
              <div className="mb-2">
                <span className="text-white font-semibold">Project:</span> {req.project_title}
              </div>
              <div className="mb-2">
                <span className="text-white font-semibold">Description:</span> {req.project_description}
              </div>
              <div className="mb-2">
                <span className="text-white font-semibold">Genre:</span> <span className="text-blue-300">{req.genre}</span>
              </div>
              <div className="mb-2">
                <span className="text-white font-semibold">Sync Fee:</span> ${req.price || req.sync_fee}
              </div>
              <div className="mb-2">
                <span className="text-white font-semibold">Deadline:</span> {new Date(req.end_date).toLocaleDateString()}
              </div>
              {hasSubmitted(req.id) ? (
                (() => {
                  const submission = syncSubmissions.find(s => s.sync_request_id === req.id);
                  if (!submission) return <div className="text-green-400 font-semibold mt-4">You have already submitted a track for this request.</div>;
                  const filetypeDisplay = (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        <span className="text-white font-semibold">File Types Available:</span>
                        <span className={`px-2 py-1 rounded ${submission.has_mp3 ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400'}`}>MP3</span>
                        <span className={`px-2 py-1 rounded ${submission.has_stems ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400'}`}>Stems</span>
                        <span className={`px-2 py-1 rounded ${submission.has_trackouts ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400'}`}>Trackouts</span>
                        <button
                          className="ml-4 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs"
                          onClick={() => {
                            setEditingFiletypes(f => ({ ...f, [req.id]: true }));
                            setEditFiletypeFields(f => ({
                              ...f,
                              [req.id]: {
                                has_mp3: !!submission.has_mp3,
                                has_stems: !!submission.has_stems,
                                has_trackouts: !!submission.has_trackouts,
                              },
                            }));
                          }}
                        >
                          Edit
                        </button>
                      </div>
                      {editingFiletypes[req.id] && (
                        <form
                          className="mt-2 flex items-center space-x-4"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const { has_mp3, has_stems, has_trackouts } = editFiletypeFields[req.id] || {};
                            if (!has_mp3 && !has_stems && !has_trackouts) {
                              setSubmissionError('Please select at least one file type available.');
                              return;
                            }
                            setSubmissionLoading(req.id);
                            setSubmissionError(null);
                            try {
                              const { error } = await supabase
                                .from('sync_submissions')
                                .update({ has_mp3, has_stems, has_trackouts })
                                .eq('id', submission.id);
                              if (error) throw error;
                              setEditingFiletypes(f => ({ ...f, [req.id]: false }));
                              setSubmissionSuccess(req.id);
                            } catch (err) {
                              setSubmissionError('Failed to update file types.');
                            } finally {
                              setSubmissionLoading(null);
                            }
                          }}
                        >
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={editFiletypeFields[req.id]?.has_mp3 || false}
                              onChange={e => setEditFiletypeFields(f => ({ ...f, [req.id]: { ...f[req.id], has_mp3: e.target.checked } }))}
                              className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span className="text-white">MP3</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={editFiletypeFields[req.id]?.has_stems || false}
                              onChange={e => setEditFiletypeFields(f => ({ ...f, [req.id]: { ...f[req.id], has_stems: e.target.checked } }))}
                              className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span className="text-white">Stems</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={editFiletypeFields[req.id]?.has_trackouts || false}
                              onChange={e => setEditFiletypeFields(f => ({ ...f, [req.id]: { ...f[req.id], has_trackouts: e.target.checked } }))}
                              className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span className="text-white">Trackouts</span>
                          </label>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                            disabled={submissionLoading === req.id}
                          >
                            {submissionLoading === req.id ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs"
                            onClick={() => setEditingFiletypes(f => ({ ...f, [req.id]: false }))}
                          >
                            Cancel
                          </button>
                        </form>
                      )}
                    </div>
                  );
                  return filetypeDisplay;
                })()
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!user) return;
                    // Validation: at least one filetype must be checked
                    const { has_mp3, has_stems, has_trackouts } = filetypeFields[req.id] || {};
                    if (!has_mp3 && !has_stems && !has_trackouts) {
                      setSubmissionError('Please select at least one file type available.');
                      return;
                    }
                    setSubmissionLoading(req.id);
                    setSubmissionError(null);
                    setSubmissionSuccess(null);
                    try {
                      const { error } = await supabase.from('sync_submissions').insert({
                        sync_request_id: req.id,
                        producer_id: user.id,
                        track_url: trackUrl,
                        notes,
                        has_mp3,
                        has_stems,
                        has_trackouts,
                      });
                      if (error) throw error;
                      setSubmissionSuccess(req.id);
                      setSubmissionFields(f => ({ ...f, [req.id]: { trackUrl: '', notes: '' } }));
                      setFiletypeFields(f => ({ ...f, [req.id]: { has_mp3: false, has_stems: false, has_trackouts: false } }));
                    } catch (err) {
                      setSubmissionError('Failed to submit track.');
                    } finally {
                      setSubmissionLoading(null);
                    }
                  }}
                  className="mt-4 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Track URL</label>
                    <input
                      type="url"
                      value={trackUrl}
                      onChange={e => setSubmissionFields(f => ({ ...f, [req.id]: { ...f[req.id], trackUrl: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="https://..."
                      required
                      disabled={submissionLoading === req.id}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Notes (optional)</label>
                    <textarea
                      value={notes}
                      onChange={e => setSubmissionFields(f => ({ ...f, [req.id]: { ...f[req.id], notes: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white/5 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      rows={2}
                      disabled={submissionLoading === req.id}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">File Types Available <span className="text-red-400">*</span></label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filetypeFields[req.id]?.has_mp3 || false}
                          onChange={e => setFiletypeFields(f => ({ ...f, [req.id]: { ...f[req.id], has_mp3: e.target.checked } }))}
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span className="text-white">MP3</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filetypeFields[req.id]?.has_stems || false}
                          onChange={e => setFiletypeFields(f => ({ ...f, [req.id]: { ...f[req.id], has_stems: e.target.checked } }))}
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span className="text-white">Stems</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filetypeFields[req.id]?.has_trackouts || false}
                          onChange={e => setFiletypeFields(f => ({ ...f, [req.id]: { ...f[req.id], has_trackouts: e.target.checked } }))}
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span className="text-white">Trackouts</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">At least one must be selected.</p>
                  </div>
                  {submissionError && <div className="text-red-400">{submissionError}</div>}
                  <button
                    type="submit"
                    className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                    disabled={submissionLoading === req.id}
                  >
                    {submissionLoading === req.id ? 'Submitting...' : 'Submit Track'}
                  </button>
                </form>
              )}
            </div>
          );
        })}
        {submissionSuccess && <div className="text-green-400 font-semibold mt-4">Track submitted successfully!</div>}
      </>
    )}
  </div>
)}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Your Tracks</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleSort('created_at')}
                  className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  <Calendar className="w-4 h-4" />
                  <ArrowUpDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  <span>A-Z</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="bg-white/10 border border-blue-500/20 rounded-lg px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Genres</option>
                  {Array.from(new Set(tracks.flatMap(track => track.genres))).map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>
            </div>

            {sortedTracks.length === 0 ? (
              <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/20">
                <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No tracks found</p>
                <Link
                  to="/producer/upload"
                  className="inline-block mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Upload Your First Track
                </Link>
              </div>
            ) : (
              sortedTracks.map((track) => (
                <div
                  key={track.id}
                  className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-blue-500/20"
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src={track.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop'}
                      alt={track.title}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white mb-1">{track.title}</h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedTrack(track);
                              setShowEditTrackModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                            title="Edit Track"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTrack(track);
                              setShowTrackProposalsDialog(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                            title="View Proposals"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTrack(track);
                              setShowDeleteDialog(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
                            title="Delete Track"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 space-y-1">
                        <p>{track.genres.join(', ')} • {track.bpm} BPM</p>
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1 text-green-400" />
                            ${track.revenue.toFixed(2)}
                          </span>
                          <span className="flex items-center">
                            <BarChart3 className="w-4 h-4 mr-1 text-blue-400" />
                            {track.sales_count} sales
                          </span>
                          {track.has_vocals && (
                            <span className="flex items-center">
                              <Mic className="w-4 h-4 mr-1 text-purple-400" />
                              {track.vocals_usage_type === 'sync_only' ? 'Sync Only' : 'Vocals'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-64 flex-shrink-0">
                      <AudioPlayer src={track.audio_url} title={track.title} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-yellow-400" />
                  Sync Proposals
                </h3>
                <Link
                  to="/producer/banking"
                  className="text-blue-400 hover:text-blue-300 transition-colors flex items-center text-sm"
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  View Earnings
                </Link>
              </div>
              
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-4 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setProposalsTab('pending')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    proposalsTab === 'pending'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Pending/Active ({filteredPendingProposals.length})
                </button>
                <button
                  onClick={() => setProposalsTab('accepted')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    proposalsTab === 'accepted'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Accepted ({filteredAcceptedProposals.length})
                </button>
                <button
                  onClick={() => setProposalsTab('paid')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    proposalsTab === 'paid'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Paid ({filteredPaidProposals.length})
                </button>
                <button
                  onClick={() => setProposalsTab('declined')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    proposalsTab === 'declined'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Declined ({filteredDeclinedProposals.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {proposalsTab === 'pending' && (
                  filteredPendingProposals.length === 0 ? (
                    <div className="text-center py-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/20">
                      <p className="text-gray-400">No pending or active proposals</p>
                    </div>
                  ) : (
                    <>
                      {filteredPendingProposals.map((proposal: Proposal) => (
                        <div
                          key={proposal.id}
                          className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-blue-500/20 relative"
                        >
                          {/* Notification Badge */}
                          {user && hasPendingAction(proposal, user.id) && (
                            <span className="absolute top-2 right-2 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                            </span>
                          )}
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-white font-medium">{proposal.track.title}</h4>
                              <p className="text-sm text-gray-400">
                                From: {proposal.client.first_name} {proposal.client.last_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Status: {proposal.status} {proposal.producer_status && `(${proposal.producer_status})`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-green-400">${(proposal.final_amount || proposal.sync_fee).toFixed(2)}</p>
                              <p className="text-xs text-gray-400">
                                Expires: {new Date(proposal.expiration_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={() => handleProposalAction(proposal, 'history')}
                              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors"
                            >
                              <Clock className="w-3 h-3 inline mr-1" />
                              History
                            </button>
                            <button
                              onClick={() => handleProposalAction(proposal, 'negotiate')}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                            >
                              <MessageSquare className="w-3 h-3 inline mr-1" />
                              Negotiate
                            </button>
                            <button
                              onClick={() => handleProposalAction(proposal, 'accept')}
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                            >
                              <Check className="w-3 h-3 inline mr-1" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleProposalAction(proposal, 'reject')}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                            >
                              <X className="w-3 h-3 inline mr-1" />
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )
                )}

                {proposalsTab === 'accepted' && (
                  filteredAcceptedProposals.length === 0 ? (
                    <div className="text-center py-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/20">
                      <p className="text-gray-400">No accepted proposals</p>
                    </div>
                  ) : (
                    <>
                      {filteredAcceptedProposals.map((proposal: Proposal) => {
                        // Check if payment is pending
                        const paymentTerms = proposal.final_payment_terms || proposal.negotiated_payment_terms || proposal.payment_terms || 'immediate';
                        const acceptanceDate = proposal.client_accepted_at || proposal.updated_at || proposal.created_at;
                        const dueDate = calculatePaymentDueDate(paymentTerms, acceptanceDate);
                        const isOverdue = dueDate < new Date();
                        const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        const isPaymentPending = paymentTerms !== 'immediate' || isOverdue;
                        
                        return (
                          <div
                            key={proposal.id}
                            className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-green-500/20 relative"
                          >
                            {/* Payment Pending Badge - moved to bottom */}
                            {isPaymentPending && (
                              <div className="absolute bottom-2 right-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                  Payment Pending
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="text-white font-medium">{proposal.track.title}</h4>
                                <p className="text-sm text-gray-400">
                                  From: {proposal.client.first_name} {proposal.client.last_name}
                                </p>
                                <p className="text-xs text-green-400">
                                  ✓ Accepted by both parties
                                </p>
                                
                                {/* Payment Due Date Info */}
                                {isPaymentPending && (
                                  <div className="mt-3 space-y-2">
                                    <p className="text-sm text-gray-400">
                                      Payment Terms: <span className="text-blue-400 font-medium">{getPaymentTermsDisplay(paymentTerms)}</span>
                                    </p>
                                    <div className="bg-white/10 rounded-lg p-3 border border-yellow-500/30">
                                      <p className={`text-lg font-bold ${isOverdue ? 'text-red-400' : daysUntilDue <= 7 ? 'text-orange-400' : 'text-green-400'}`}>
                                        {isOverdue ? '⚠️ OVERDUE' : daysUntilDue === 0 ? '🕐 DUE TODAY' : daysUntilDue === 1 ? '🕐 DUE TOMORROW' : `📅 DUE IN ${daysUntilDue} DAYS`}
                                      </p>
                                      <p className="text-base font-medium text-white mt-1">
                                        Due Date: {dueDate.toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-green-400">${(proposal.final_amount || proposal.sync_fee).toFixed(2)}</p>
                                <p className="text-xs text-gray-400">
                                  Accepted: {new Date(proposal.updated_at || proposal.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2 mt-2">
                              <button
                                onClick={() => handleProposalAction(proposal, 'history')}
                                className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors"
                              >
                                <Clock className="w-3 h-3 inline mr-1" />
                                History
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )
                )}

                {proposalsTab === 'paid' && (
                  filteredPaidProposals.length === 0 ? (
                    <div className="text-center py-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/20">
                      <p className="text-gray-400">No paid proposals</p>
                    </div>
                  ) : (
                    <>
                      {filteredPaidProposals.map((proposal: Proposal) => (
                        <div
                          key={proposal.id}
                          className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20 relative"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-white font-medium">{proposal.track.title}</h4>
                              <p className="text-sm text-gray-400">
                                From: {proposal.client.first_name} {proposal.client.last_name}
                              </p>
                              <p className="text-xs text-purple-400">
                                ✓ Paid - Sync License
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-purple-400">${(proposal.final_amount || proposal.sync_fee).toFixed(2)}</p>
                              <p className="text-xs text-gray-400">
                                Paid: {new Date(proposal.updated_at || proposal.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={() => handleProposalAction(proposal, 'history')}
                              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors"
                            >
                              <Clock className="w-3 h-3 inline mr-1" />
                              History
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )
                )}

                {proposalsTab === 'declined' && (
                  filteredDeclinedProposals.length === 0 ? (
                    <div className="text-center py-6 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/20">
                      <p className="text-gray-400">No declined proposals</p>
                    </div>
                  ) : (
                    <>
                      {filteredDeclinedProposals.map((proposal: Proposal) => (
                      <div
                        key={proposal.id}
                        className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-red-500/20"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-white font-medium">{proposal.track.title}</h4>
                            <p className="text-sm text-gray-400">
                              From: {proposal.client.first_name} {proposal.client.last_name}
                            </p>
                            <p className="text-xs text-red-400">
                              ✗ Declined {proposal.producer_status === 'rejected' ? 'by you' : 'by client'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-400">${proposal.sync_fee.toFixed(2)}</p>
                            <p className="text-xs text-gray-400">
                              Declined: {new Date(proposal.updated_at || proposal.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => handleProposalAction(proposal, 'history')}
                            className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors"
                          >
                            <Clock className="w-3 h-3 inline mr-1" />
                            History
                          </button>
                        </div>
                      </div>
                      ))}
                    </>
                  )
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                Sales Overview
              </h3>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-blue-500/20">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Total Revenue</span>
                      <span className="text-white font-semibold">${stats.totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full w-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Total Sales</span>
                      <span className="text-white font-semibold">{stats.totalSales}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Pending Proposals</span>
                      <span className="text-white font-semibold">{stats.pendingProposals}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 rounded-full" 
                        style={{ width: `${(stats.pendingProposals / Math.max(1, stats.totalTracks)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowRevenueBreakdown(true)}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  View Detailed Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedTrack && showDeleteDialog && (
        <DeleteTrackDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setSelectedTrack(null);
          }}
          trackTitle={selectedTrack.title}
          onConfirm={confirmDeleteTrack}
        />
      )}

      {selectedTrack && showTrackProposalsDialog && (
        <TrackProposalsDialog
          isOpen={showTrackProposalsDialog}
          onClose={() => {
            setShowTrackProposalsDialog(false);
            setSelectedTrack(null);
          }}
          trackId={selectedTrack.id}
          trackTitle={selectedTrack.title}
        />
      )}

      {showRevenueBreakdown && (
        <RevenueBreakdownDialog
          isOpen={showRevenueBreakdown}
          onClose={() => setShowRevenueBreakdown(false)}
          producerId={user?.id}
        />
      )}

      {selectedProposal && showNegotiationDialog && (
        <ProposalNegotiationDialog
          isOpen={showNegotiationDialog}
          onClose={() => {
            setShowNegotiationDialog(false);
            setSelectedProposal(null);
          }}
          proposal={selectedProposal}
          onNegotiationSent={() => {
            setShowNegotiationDialog(false);
            setSelectedProposal(null);
            fetchDashboardData();
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
          action={confirmAction}
          proposal={selectedProposal}
          onConfirm={handleProposalStatusChange}
        />
      )}

      {showProfileDialog && (
        <ProducerProfile
          isOpen={showProfileDialog}
          onClose={() => setShowProfileDialog(false)}
          onProfileUpdated={fetchDashboardData}
        />
      )}

      {selectedTrack && showEditTrackModal && (
        <EditTrackModal
          isOpen={showEditTrackModal}
          onClose={() => {
            setShowEditTrackModal(false);
            setSelectedTrack(null);
          }}
          track={selectedTrack}
          onUpdate={fetchDashboardData}
        />
      )}

      {chatSubmission && (
        <SyncRequestChatModal
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          syncRequestId={chatSubmission.syncRequestId}
          submissionId={chatSubmission.submissionId}
          currentUserId={user?.id || ''}
          currentUserRole="producer"
        />
      )}
    </div>
  );
}
