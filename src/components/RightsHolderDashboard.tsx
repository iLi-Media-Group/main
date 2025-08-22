import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { supabase } from '../lib/supabase';
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
  Plus,
  Search,
  Filter,
  RefreshCw
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
  payment_terms: string;
  is_exclusive: boolean;
  expiration_date: string;
  is_urgent: boolean;
  status: string;
  client_status: string;
  producer_status: string;
  negotiation_status: string;
  last_message_sender_id?: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  client: {
    first_name: string;
    last_name: string;
    email: string;
  };
  track: {
    id: string;
    title: string;
    artist: string;
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
  created_at: string;
  updated_at: string;
  client: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export function RightsHolderDashboard() {
  const { user, rightsHolder, rightsHolderProfile } = useUnifiedAuth();
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
  
  // Custom Sync Requests state
  const [customSyncRequests, setCustomSyncRequests] = useState<CustomSyncRequest[]>([]);
  const [customSyncRequestsLoading, setCustomSyncRequestsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      // If no user, still set loading to false to show empty state
      setLoading(false);
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
      
      // Fetch custom sync requests
      await fetchCustomSyncRequests();

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
      
      // Fetch sync proposals for these tracks
      const { data: proposalsData, error: proposalsError } = await supabase
        .from('sync_proposals')
        .select(`
          *,
          client:profiles!sync_proposals_client_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          track:tracks(
            id,
            title,
            artist
          )
        `)
        .in('track_id', trackIds)
        .order('created_at', { ascending: false });
      
      if (proposalsError) throw proposalsError;
      
      setSyncProposals(proposalsData || []);
    } catch (error) {
      console.error('Error fetching sync proposals:', error);
      setSyncProposals([]);
    } finally {
      setSyncProposalsLoading(false);
    }
  };

  // Fetch custom sync requests
  const fetchCustomSyncRequests = async () => {
    if (!user) return;
    
    try {
      setCustomSyncRequestsLoading(true);
      
      const { data: requestsData, error: requestsError } = await supabase
        .from('custom_sync_requests')
        .select(`
          *,
          client:profiles!custom_sync_requests_client_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('selected_producer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (requestsError) throw requestsError;
      
      setCustomSyncRequests(requestsData || []);
    } catch (error) {
      console.error('Error fetching custom sync requests:', error);
      setCustomSyncRequests([]);
    } finally {
      setCustomSyncRequestsLoading(false);
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
                  Welcome back, {rightsHolder?.company_name}
                </h1>
                <p className="text-gray-300 mt-1">
                  {rightsHolder?.rights_holder_type === 'record_label' ? 'Record Label' : 'Publisher'} Dashboard
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

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Revenue</p>
                <p className="text-2xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
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

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                <Link
                  to="/rights-holder/activity"
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
          </div>
        </div>

        {/* Account Status */}
        <div className="mt-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Account Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                                  <div>
                    <p className="text-gray-300">Verification Status</p>
                    <p className={`font-medium ${getStatusColor(rightsHolder?.verification_status || '')}`}>
                      {rightsHolder?.verification_status?.charAt(0).toUpperCase() + rightsHolder?.verification_status?.slice(1) || 'N/A'}
                    </p>
                  </div>
                  {getStatusIcon(rightsHolder?.verification_status || '')}
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div>
                  <p className="text-gray-300">Account Type</p>
                  <p className="font-medium text-white">
                    {rightsHolder?.rights_holder_type === 'record_label' ? 'Record Label' : 'Publisher'}
                  </p>
                </div>
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>

                             <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                 <div>
                   <p className="text-gray-300">Terms Accepted</p>
                   <p className="font-medium text-green-400">
                     {rightsHolder?.terms_accepted ? 'Yes' : 'No'}
                   </p>
                 </div>
                 {rightsHolder?.terms_accepted ? (
                   <CheckCircle className="w-5 h-5 text-green-400" />
                 ) : (
                   <AlertCircle className="w-5 h-5 text-red-400" />
                 )}
               </div>

               <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                 <div>
                   <p className="text-gray-300">Rights Authority Declaration</p>
                   <p className="font-medium text-green-400">
                     {rightsHolder?.rights_authority_declaration_accepted ? 'Accepted' : 'Pending'}
                   </p>
                 </div>
                 {rightsHolder?.rights_authority_declaration_accepted ? (
                   <CheckCircle className="w-5 h-5 text-green-400" />
                 ) : (
                   <AlertCircle className="w-5 h-5 text-red-400" />
                 )}
               </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div>
                  <p className="text-gray-300">Member Since</p>
                  <p className="font-medium text-white">
                    {formatDate(rightsHolder?.created_at || '')}
                  </p>
                </div>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Sync Proposals Section */}
        <div className="mt-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Sync Proposals</h3>
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

            {syncProposalsLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading sync proposals...</p>
              </div>
            ) : syncProposals.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No sync proposals yet</p>
                <p className="text-sm text-gray-500 mt-1">Proposals will appear here when clients request your tracks</p>
              </div>
            ) : (
              <div className="space-y-4">
                {syncProposals.slice(0, 5).map((proposal) => (
                  <div
                    key={proposal.id}
                    className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-white">{proposal.track.title}</h4>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getProposalStatusColor(proposal.status)}`}>
                          {getProposalStatusIcon(proposal.status)}
                          <span className="ml-1">{proposal.status}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">
                        {proposal.client.first_name} {proposal.client.last_name} • ${proposal.sync_fee} • {proposal.project_type}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(proposal.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/sync-proposal/${proposal.id}`}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
                {syncProposals.length > 5 && (
                  <div className="text-center pt-4">
                    <Link
                      to="/sync-proposals"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      View all {syncProposals.length} proposals
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Custom Sync Requests Section */}
        <div className="mt-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Custom Sync Requests</h3>
                <p className="text-gray-400 text-sm">Manage custom sync licensing requests</p>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/custom-sync-request"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Request
                </Link>
                <button
                  onClick={fetchCustomSyncRequests}
                  disabled={customSyncRequestsLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors flex items-center"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${customSyncRequestsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {customSyncRequestsLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading custom sync requests...</p>
              </div>
            ) : customSyncRequests.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No custom sync requests yet</p>
                <p className="text-sm text-gray-500 mt-1">Create a request to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {customSyncRequests.slice(0, 5).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-white">{request.project_title}</h4>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getProposalStatusColor(request.status)}`}>
                          {getProposalStatusIcon(request.status)}
                          <span className="ml-1">{request.status}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">
                        {request.client.first_name} {request.client.last_name} • ${request.sync_fee} • {request.genre}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/custom-sync-request/${request.id}`}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
                {customSyncRequests.length > 5 && (
                  <div className="text-center pt-4">
                    <Link
                      to="/custom-sync-requests"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      View all {customSyncRequests.length} requests
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
