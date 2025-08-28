import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { supabase } from '../lib/supabase';
import { formatSubGenresForDisplay } from '../utils/genreUtils';
import { ProposalNegotiationDialog } from './ProposalNegotiationDialog';
import { ProposalHistoryDialog } from './ProposalHistoryDialog';
import { ProposalConfirmDialog } from './ProposalConfirmDialog';
import { PlaylistManager } from './PlaylistManager';
import { 
  Building2, 
  Music, 
  FileText, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Upload,
  Settings,
  BarChart3,
  DollarSign,
  Calendar,
  ArrowRight,
  Mail,
  MessageSquare,
  MessageCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  X,
  Check,
  Eye
} from 'lucide-react';

interface DashboardStats {
  totalRecordings: number;
  pendingVerifications: number;
  activeLicenses: number;
  totalRevenue: number;
}

interface RecentActivity {
  id: string;
  type: 'upload' | 'verification' | 'license' | 'split_sheet' | 'sync_proposal' | 'custom_sync';
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
}

interface SyncProposal {
  id: string;
  track_id: string;
  client_id: string;
  project_type: string;
  sync_fee: number;
  final_amount?: number;
  negotiated_amount?: number;
  payment_terms: string;
  final_payment_terms?: string;
  negotiated_payment_terms?: string;
  expiration_date: string;
  is_urgent: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  producer_status: string;
  client_status: string;
  negotiation_status: string;
  client_accepted_at?: string;
  last_message_sender_id?: string;
  last_message_at?: string;
  payment_status?: string;
  client: {
    first_name: string;
    last_name: string;
    email: string;
  };
  track: {
    id: string;
    title: string;
  };
}

interface CustomSyncRequest {
  id: string;
  client_id: string;
  project_title: string;
  project_description: string;
  sync_fee: number;
  end_date: string;
  genre: string;
  sub_genres: string[];
  status: string;
  selected_producer_id?: string;
  selected_rights_holder_id?: string;
  created_at: string;
  updated_at: string;
  client: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export function RightsHolderDashboard() {
  const { user, profile } = useUnifiedAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalRecordings: 0,
    pendingVerifications: 0,
    activeLicenses: 0,
    totalRevenue: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sync Proposals state
  const [syncProposals, setSyncProposals] = useState<SyncProposal[]>([]);
  const [syncProposalsLoading, setSyncProposalsLoading] = useState(false);
  const [proposalsTab, setProposalsTab] = useState<'pending' | 'accepted' | 'paid' | 'declined'>('pending');
  
  // Custom Sync Requests state
  const [customSyncRequests, setCustomSyncRequests] = useState<CustomSyncRequest[]>([]);
  const [customSyncRequestsLoading, setCustomSyncRequestsLoading] = useState(false);
  const [completedCustomSyncRequests, setCompletedCustomSyncRequests] = useState<any[]>([]);
  const [customSyncTab, setCustomSyncTab] = useState<'open' | 'completed'>('open');

  // Proposal action state
  const [selectedProposal, setSelectedProposal] = useState<SyncProposal | null>(null);
  const [showNegotiationDialog, setShowNegotiationDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'reject'>('accept');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      // If no user, still set loading to false to show empty state
      setLoading(false);
    }
  }, [user]);

  // Separate useEffect for custom sync requests (matching Producer Dashboard pattern)
  useEffect(() => {
    if (user) {
      fetchCustomSyncRequests();
      fetchCompletedCustomSyncRequests();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) {
      console.log('No user available, skipping dashboard data fetch');
      return;
    }

    console.log('Fetching dashboard data for user:', user.id);
    try {
      setLoading(true);

      // Initialize stats with default values
      let recordingsCount = 0;
      let pendingCount = 0;
      let licensesCount = 0;

      // Try to fetch master recordings count (handle missing table gracefully)
      try {
        const { count } = await supabase
          .from('master_recordings')
          .select('*', { count: 'exact', head: true })
          .eq('rights_holder_id', user.id);
        recordingsCount = count || 0;
      } catch (error) {
        console.log('master_recordings table not found, using default value');
        recordingsCount = 0;
      }

      // Try to fetch pending verifications (handle missing table gracefully)
      try {
        const { count } = await supabase
          .from('master_recordings')
          .select('*', { count: 'exact', head: true })
          .eq('rights_holder_id', user.id)
          .eq('rights_verification_status', 'pending');
        pendingCount = count || 0;
      } catch (error) {
        console.log('Could not fetch pending verifications, using default value');
        pendingCount = 0;
      }

      // Try to fetch active licenses (handle missing table gracefully)
      try {
        const { count } = await supabase
          .from('rights_licenses')
          .select('*', { count: 'exact', head: true })
          .eq('license_status', 'active');
        licensesCount = count || 0;
      } catch (error) {
        console.log('rights_licenses table not found, using default value');
        licensesCount = 0;
      }

      // Fetch total revenue (placeholder for now)
      const totalRevenue = 0; // This would be calculated from actual license data

      setStats({
        totalRecordings: recordingsCount,
        pendingVerifications: pendingCount,
        activeLicenses: licensesCount,
        totalRevenue,
      });

      // Try to fetch recent activity from tracks table (handle missing table gracefully)
      try {
        const { data: activityData } = await supabase
          .from('tracks')
          .select('id, title, status, created_at')
          .eq('track_producer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (activityData) {
          const activity: RecentActivity[] = activityData.map(track => ({
            id: track.id,
            type: 'upload',
            title: track.title,
            description: `Track uploaded`,
            status: track.status === 'active' ? 'approved' : 'pending',
            created_at: track.created_at,
          }));
          setRecentActivity(activity);
        } else {
          setRecentActivity([]);
        }
      } catch (error) {
        console.log('Could not fetch recent activity, using empty array');
        setRecentActivity([]);
      }

             // Fetch sync proposals for rights holder tracks
       await fetchSyncProposals();

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values on error
      setStats({
        totalRecordings: 0,
        pendingVerifications: 0,
        activeLicenses: 0,
        totalRevenue: 0,
      });
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Fetch sync proposals for rights holder tracks
  const fetchSyncProposals = async () => {
    if (!user) return;
    
    try {
      setSyncProposalsLoading(true);
      
      // First get all tracks owned by this rights holder
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('id')
        .eq('track_producer_id', user.id);
      
      if (tracksError) throw tracksError;
      
      if (!tracksData || tracksData.length === 0) {
        setSyncProposals([]);
        return;
      }
      
      const trackIds = tracksData.map(track => track.id);
      
      // Fetch sync proposals for these tracks (matching producer dashboard pattern)
      const { data: proposalsData, error: proposalsError } = await supabase
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
      
      if (proposalsError) throw proposalsError;
      
      // Transform the data to match the expected structure
      const transformedData = (proposalsData || []).map((proposal: any) => ({
        ...proposal,
        client: Array.isArray(proposal.client) ? proposal.client[0] : proposal.client,
        track: Array.isArray(proposal.track) ? proposal.track[0] : proposal.track,
      }));
      
      setSyncProposals(transformedData);
    } catch (error) {
      console.error('Error fetching sync proposals:', error);
      setSyncProposals([]);
    } finally {
      setSyncProposalsLoading(false);
    }
  };

  // Fetch custom sync requests (simplified to match Producer Dashboard)
  const fetchCustomSyncRequests = async () => {
    if (!user) return;
    
    try {
      setCustomSyncRequestsLoading(true);
      
      // Simplified query matching Producer Dashboard exactly
      const { data: requestsData, error: requestsError } = await supabase
        .from('custom_sync_requests')
        .select('*')
        .eq('status', 'open')
        .gte('end_date', new Date().toISOString())
        .or(`selected_rights_holder_id.eq.${user.id},selected_rights_holder_id.is.null`)
        .order('created_at', { ascending: false });
      
      console.log('Debug - User ID:', user.id);
      console.log('Debug - Fetched custom sync requests:', requestsData);
      
      if (requestsError) {
        console.error('Error fetching custom sync requests:', requestsError);
        throw requestsError;
      }
      
      setCustomSyncRequests(requestsData || []);
    } catch (error) {
      console.error('Error fetching custom sync requests:', error);
      setCustomSyncRequests([]);
    } finally {
      setCustomSyncRequestsLoading(false);
    }
  };

  // Fetch completed custom sync requests for rights holders (simplified to match Producer Dashboard)
  const fetchCompletedCustomSyncRequests = async () => {
    if (!user) return;
    
    try {
      const { data: completedCustomSyncRequestsData, error: customSyncError } = await supabase
        .from('custom_sync_requests')
        .select('*')
        .in('status', ['completed', 'paid'])
        .or(`selected_rights_holder_id.eq.${user.id},selected_rights_holder_id.is.null`)
        .order('updated_at', { ascending: false });

      if (customSyncError) {
        console.error('Error fetching completed custom sync requests:', customSyncError);
        return;
      }

      setCompletedCustomSyncRequests(completedCustomSyncRequestsData || []);
    } catch (error) {
      console.error('Error fetching completed custom sync requests:', error);
      setCompletedCustomSyncRequests([]);
    }
  };

  const getProposalStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-400 bg-green-400/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'rejected':
        return 'text-red-400 bg-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getProposalStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  // Filter sync proposals by status
  const filteredPendingProposals = syncProposals.filter(p =>
    (p.status === 'pending' || 
    (p.producer_status !== 'accepted' && p.producer_status !== 'rejected')) &&
    p.producer_status !== 'rejected' && 
    p.client_status !== 'rejected'
  );

  const filteredAcceptedProposals = syncProposals.filter(p =>
    p.producer_status === 'accepted' && p.client_status === 'accepted' && p.payment_status !== 'paid'
  );

  const filteredPaidProposals = syncProposals.filter(
    p => p.payment_status === 'paid'
  );

  const filteredDeclinedProposals = syncProposals.filter(p =>
    p.producer_status === 'rejected' || p.client_status === 'rejected'
  );

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

  // Add a helper to determine if a proposal has a pending action
  const hasPendingAction = (proposal: SyncProposal, userId: string): boolean => {
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
  };

  // Handle proposal actions (negotiate, history, accept, reject)
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

     // Handle proposal status change (accept/reject)
   const handleProposalStatusChange = async () => {
     if (!selectedProposal || !user) return;
     
     try {
       // Update proposal producer_status (rights holder is the producer in this context)
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
       setSyncProposals(syncProposals.map(p => 
         p.id === selectedProposal.id 
           ? { ...p, producer_status: confirmAction === 'accept' ? 'accepted' : 'rejected', updated_at: new Date().toISOString() } 
           : p
       ));
       
       setShowConfirmDialog(false);
       setSelectedProposal(null);
       
     } catch (err) {
       console.error(`Error ${confirmAction}ing proposal:`, err);
       setError(`Failed to ${confirmAction} proposal`);
     }
   };

   // Handle payment pending proposal (for rights holders to initiate payment)
   const handlePaymentPendingProposal = async (proposal: SyncProposal) => {
     try {
       // Ensure negotiation is finalized before payment
       if (
         proposal.client_status === 'accepted' &&
         proposal.producer_status === 'accepted' &&
         (proposal.status !== 'accepted' || proposal.negotiation_status !== 'accepted')
       ) {
         const { error: rpcError } = await supabase.rpc('handle_negotiation_acceptance', {
           proposal_id: proposal.id,
           is_sync_proposal: true
         });
         if (rpcError) throw rpcError;
       }
       
       const paymentTerms = proposal.final_payment_terms || proposal.negotiated_payment_terms || proposal.payment_terms || 'immediate';
       const amount = proposal.final_amount || proposal.sync_fee;
       
       // Use stripe-invoice endpoint for sync proposal payments (handles real customers)
       const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-invoice`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           proposal_id: proposal.id,
           amount: Math.round(amount * 100),
           client_user_id: user?.id,
           payment_terms: paymentTerms,
           metadata: {
             description: `Sync license for "${proposal.track?.title}"`,
             payment_terms: paymentTerms
           }
         })
       });

       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || 'Failed to create payment session');
       }

       const { url } = await response.json();
       window.open(url, '_self');
     } catch (err) {
       console.error('Error initiating payment:', err);
       alert('Failed to initiate payment. Please try again.');
     }
   };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-900/90">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Welcome back, {profile?.company_name}
              </h1>
              <p className="text-gray-300 mt-1">
                {profile?.rights_holder_type === 'record_label' ? 'Record Label' : 'Publisher'} Dashboard
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/profile"
                className="p-2 text-gray-300 hover:text-white transition-colors"
              >
                <Settings className="w-6 h-6" />
              </Link>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Music className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Recordings</p>
                <p className="text-2xl font-bold text-white">{stats.totalRecordings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Pending Verifications</p>
                <p className="text-2xl font-bold text-white">{stats.pendingVerifications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Active Licenses</p>
                <p className="text-2xl font-bold text-white">{stats.activeLicenses}</p>
              </div>
            </div>
          </div>

          <Link
            to="/rights-holder/banking"
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer group"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Revenue</p>
                <p className="text-2xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/rights-holder/upload"
                  className="flex items-center p-3 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors group"
                >
                  <Upload className="w-5 h-5 text-blue-400 mr-3" />
                  <span className="text-white">Upload New Recording</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/rights-holder/recordings"
                  className="flex items-center p-3 bg-orange-600/20 hover:bg-orange-600/30 rounded-lg transition-colors group"
                >
                  <Music className="w-5 h-5 text-orange-400 mr-3" />
                  <span className="text-white">Manage Recordings</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/rights-holder/split-sheets"
                  className="flex items-center p-3 bg-green-600/20 hover:bg-green-600/30 rounded-lg transition-colors group"
                >
                  <FileText className="w-5 h-5 text-green-400 mr-3" />
                  <span className="text-white">Manage Split Sheets</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/rights-holder/analytics"
                  className="flex items-center p-3 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg transition-colors group"
                >
                  <BarChart3 className="w-5 h-5 text-purple-400 mr-3" />
                  <span className="text-white">View Analytics</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/rights-holder/licensing"
                  className="flex items-center p-3 bg-teal-600/20 hover:bg-teal-600/30 rounded-lg transition-colors group"
                >
                  <FileText className="w-5 h-5 text-teal-400 mr-3" />
                  <span className="text-white">Licensing & Revenue</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/rights-holder/e-signatures"
                  className="flex items-center p-3 bg-indigo-600/20 hover:bg-indigo-600/30 rounded-lg transition-colors group"
                >
                  <Mail className="w-5 h-5 text-indigo-400 mr-3" />
                  <span className="text-white">E-Signatures</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center p-3 bg-gray-600/20 hover:bg-gray-600/30 rounded-lg transition-colors group"
                >
                  <Users className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-white">Update Profile</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity and Sync Sections */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Activity */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                <Link
                  to="/rights-holder/recordings"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  View all
                </Link>
              </div>

              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No recent activity</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Start by uploading your first recording
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center p-4 bg-gray-800/30 rounded-lg"
                    >
                      {getStatusIcon(activity.status)}
                      <div className="ml-3 flex-1">
                        <p className="text-white font-medium">{activity.title}</p>
                        <p className="text-sm text-gray-400">{activity.description}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sync Proposals Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-yellow-400" />
                    Sync Proposals
                  </h3>
                  <p className="text-gray-400 text-sm">Manage sync licensing proposals for your tracks</p>
                </div>
                <button
                  onClick={fetchSyncProposals}
                  disabled={syncProposalsLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors flex items-center"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncProposalsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
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
                      {filteredPendingProposals.map((proposal) => (
                        <div
                          key={proposal.id}
                          className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-blue-500/20 hover:border-blue-500/40 transition-colors relative"
                        >
                          {/* Notification Badge */}
                          {user && hasPendingAction(proposal, user.id) && (
                            <span className="absolute top-2 right-2 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                            </span>
                          )}
                          
                          {/* Urgent Badge */}
                          {proposal.is_urgent && (
                            <div className="absolute bottom-2 right-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                                ⚡ URGENT
                              </span>
                            </div>
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
                      {filteredAcceptedProposals.map((proposal) => {
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
                            className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-green-500/20 hover:border-green-500/40 transition-colors relative"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="text-white font-medium">{proposal.track.title}</h4>
                                <p className="text-sm text-gray-400">
                                  From: {proposal.client.first_name} {proposal.client.last_name}
                                </p>
                                <p className="text-xs text-green-400">
                                  ✓ Accepted by both parties
                                </p>
                                

                              </div>
                                                             <div className="text-right">
                                 <p className="text-lg font-semibold text-green-400">${(proposal.final_amount || proposal.sync_fee).toFixed(2)}</p>
                                 <p className="text-xs text-gray-400">
                                   Accepted: {new Date(proposal.updated_at || proposal.created_at).toLocaleDateString()}
                                 </p>
                                 {/* Urgent Badge - moved to underneath the amount and date */}
                                 {proposal.is_urgent && (
                                   <div className="mt-2">
                                     <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                                       ⚡ URGENT
                                     </span>
                                   </div>
                                 )}
                                 {/* Rights holders don't make payments - overdue badge removed */}
                                 {/* Rights holders don't make payments - payment pending badge removed */}
                               </div>
                             </div>
                             <div className="flex items-center justify-between mt-2">
                               <div className="flex space-x-2">
                                 <button
                                   onClick={() => handleProposalAction(proposal, 'history')}
                                   className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors"
                                 >
                                   <Clock className="w-3 h-3 inline mr-1" />
                                   History
                                 </button>
                                                                 {/* Rights holders don't make payments - they receive payments */}
                                {/* Payment is handled by the client, not the rights holder */}
                               </div>
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
                      {filteredPaidProposals.map((proposal) => (
                        <div
                          key={proposal.id}
                          className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20 hover:border-purple-500/40 transition-colors relative"
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
                      {filteredDeclinedProposals.map((proposal) => (
                      <div
                        key={proposal.id}
                        className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-red-500/20 hover:border-red-500/40 transition-colors"
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
              
                             {/* View All Link */}
               {syncProposals.length > 0 && (
                 <div className="text-center pt-4 border-t border-white/10">
                   <Link
                     to="/sync-proposals"
                     className="text-blue-400 hover:text-blue-300 text-sm"
                   >
                     View all {syncProposals.length} proposals
                   </Link>
                 </div>
               )}
            </div>

            {/* Custom Sync Requests Section */}
            <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-colors p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <button
                    className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${customSyncTab === 'open' ? 'bg-blue-700 text-white' : 'bg-white/10 text-blue-200 hover:bg-blue-800'}`}
                    onClick={() => setCustomSyncTab('open')}
                  >
                    Open Custom Sync Requests
                  </button>
                  <button
                    className={`ml-2 px-4 py-2 rounded-t-lg font-semibold transition-colors ${customSyncTab === 'completed' ? 'bg-blue-700 text-white' : 'bg-white/10 text-blue-200 hover:bg-blue-800'}`}
                    onClick={() => setCustomSyncTab('completed')}
                  >
                    Completed Custom Syncs (Paid)
                  </button>
                </div>
                                 <Link
                   to={`/custom-sync-request?requestId=${customSyncRequests[0]?.id || ''}`}
                   className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
                 >
                   <MessageCircle className="w-4 h-4 mr-2" />
                   See Submissions
                 </Link>
              </div>
              <div className="bg-blue-900/60 rounded-b-lg p-4">
                {customSyncTab === 'open' ? (
                  customSyncRequestsLoading ? (
                    <div className="text-blue-300">Loading...</div>
                  ) : customSyncRequests.length === 0 ? (
                    <div className="text-gray-400">No open custom sync requests at this time.</div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto space-y-4">
                      {customSyncRequests.map((req) => (
                        <div key={req.id} className="bg-blue-800/80 border border-blue-500/40 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-white text-lg mb-1">{req.project_title}</div>
                            <div className="text-gray-300 mb-1">{req.project_description}</div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-1">
                              <span><strong>Sync Fee:</strong> ${req.sync_fee?.toFixed(2)}</span>
                              <span><strong>End Date:</strong> {new Date(req.end_date).toLocaleDateString()}</span>
                              <span><strong>Genre:</strong> {req.genre}</span>
                              <span><strong>Sub-genres:</strong> {formatSubGenresForDisplay(req.sub_genres)}</span>
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0 md:ml-6 flex-shrink-0">
                            <Link
                              to={`/custom-sync-request?requestId=${req.id}`}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                            >
                              Submit Track
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  completedCustomSyncRequests.length === 0 ? (
                    <div className="text-gray-400">No completed custom syncs yet.</div>
                  ) : (
                    <div className="space-y-4">
                      {completedCustomSyncRequests.map((req) => {
                        const allFilesUploaded = req.mp3_url && req.trackouts_url && req.stems_url && req.split_sheet_url;
                        const clientName = 'Client'; // Simplified since we removed the client join
                        
                        return (
                          <div key={req.id} className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                              <div className="flex-1">
                                <div className="font-semibold text-white text-lg mb-1">{req.project_title}</div>
                                <div className="text-gray-300 mb-1">{req.project_description}</div>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-1">
                                  <span><strong>Client:</strong> {clientName}</span>
                                  <span><strong>Sync Fee:</strong> ${req.sync_fee?.toFixed(2)}</span>
                                  <span><strong>Final Amount:</strong> ${req.final_amount?.toFixed(2) || req.sync_fee?.toFixed(2)}</span>
                                  <span><strong>Genre:</strong> {req.genre}</span>
                                  <span><strong>Status:</strong> {req.status}</span>
                                  <span><strong>Payment Status:</strong> <span className="text-green-400">{req.payment_status}</span></span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  <span><strong>Completed:</strong> {new Date(req.updated_at || req.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="mt-4 md:mt-0 md:ml-6 flex-shrink-0 flex flex-col gap-2">
                                <div className="flex flex-col gap-2">
                                  <div className="space-y-1">
                                    {req.mp3_url && (
                                      <div className="flex items-center text-green-400 text-sm">
                                        <Check className="w-4 h-4 mr-2" />
                                        <span>MP3 File</span>
                                      </div>
                                    )}
                                    {req.trackouts_url && (
                                      <div className="flex items-center text-green-400 text-sm">
                                        <Check className="w-4 h-4 mr-2" />
                                        <span>Trackouts ZIP</span>
                                      </div>
                                    )}
                                    {req.stems_url && (
                                      <div className="flex items-center text-green-400 text-sm">
                                        <Check className="w-4 h-4 mr-2" />
                                        <span>Stems ZIP</span>
                                      </div>
                                    )}
                                    {req.split_sheet_url && (
                                      <div className="flex items-center text-green-400 text-sm">
                                        <Check className="w-4 h-4 mr-2" />
                                        <span>Split Sheet PDF</span>
                                      </div>
                                    )}
                                    {!req.mp3_url && !req.trackouts_url && !req.stems_url && !req.split_sheet_url && (
                                      <div className="flex items-center text-gray-400 text-sm">
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        <span>No files uploaded</span>
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => navigate(`/rights-holder/custom-sync-upload?requestId=${req.id}`)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center"
                                  >
                                    <Upload className="w-5 h-5 mr-2" />
                                    {allFilesUploaded ? 'Re-upload Files' : 'Upload Files'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Playlists Section */}
        <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Record Label Playlists</h2>
            <Link
              to="/record-label/playlists"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Manage Playlists
            </Link>
          </div>
          <PlaylistManager accountType="rights_holder" title="Record Label Playlists" />
        </div>


      </div>

      {/* Proposal Action Dialogs */}
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
    </div>
  );
}