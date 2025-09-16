import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  BarChart3,
  Calendar,
  ArrowRight,
  RefreshCw,
  Music,
  Send,
  Plus,
  Eye
} from 'lucide-react';
import { CreatePrivateBriefModal } from './CreatePrivateBriefModal';
import { SubmitToBriefModal } from './SubmitToBriefModal';

interface AgentEarnings {
  id: string;
  commission_amount: number;
  commission_percentage: number;
  total_deal_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  paid_at?: string;
  custom_sync_request: {
    project_title: string;
    sync_fee: number;
  };
}

interface AgentStats {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  totalDeals: number;
  averageCommission: number;
}

interface PitchOpportunity {
  id: string;
  title: string;
  description: string;
  client_name: string;
  client_email: string;
  client_company: string;
  brief_type: string;
  genre_requirements: string[];
  mood_requirements: string[];
  deadline: string;
  submission_email: string;
  submission_instructions?: string;
  budget_range?: string;
  status: string;
  is_priority: boolean;
  created_at: string;
  total_submissions: number;
  selected_submissions: number;
  placed_submissions: number;
  assigned_agent: string | null;
  assigned_agent_name?: string;
}

interface PitchSubmission {
  id: string;
  opportunity_id: string;
  track_id: string;
  submitted_by: string;
  submission_notes: string;
  submission_status: string;
  selection_notes: string;
  created_at: string;
  track_title: string;
  track_genre: string;
  track_mood: string;
  track_bpm: number;
  track_duration: number;
  producer_name: string;
  artist_name: string;
  playlist_name?: string;
  playlist_url?: string;
}

export function AgentDashboard() {
  const { user, profile } = useUnifiedAuth();
  const [earnings, setEarnings] = useState<AgentEarnings[]>([]);
  const [stats, setStats] = useState<AgentStats>({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    totalDeals: 0,
    averageCommission: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'earnings' | 'deals' | 'pitch_management'>('overview');
  
  // Pitch management state
  const [pitchOpportunities, setPitchOpportunities] = useState<PitchOpportunity[]>([]);
  const [pitchSubmissions, setPitchSubmissions] = useState<PitchSubmission[]>([]);
  const [showCreateBrief, setShowCreateBrief] = useState(false);
  const [showSubmitToBrief, setShowSubmitToBrief] = useState(false);
  const [selectedOpportunityForSubmission, setSelectedOpportunityForSubmission] = useState<PitchOpportunity | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchAgentData();
      if (activeTab === 'pitch_management') {
        fetchPitchData();
      }
    }
  }, [user, activeTab]);

  const fetchAgentData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch agent earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from('agent_earnings')
        .select(`
          id,
          commission_amount,
          commission_percentage,
          total_deal_amount,
          status,
          created_at,
          paid_at,
          custom_sync_request:custom_sync_requests (
            project_title,
            sync_fee
          )
        `)
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });

      if (earningsError) throw earningsError;

      // Fetch custom sync requests created by this agent
      const { data: dealsData, error: dealsError } = await supabase
        .from('custom_sync_requests')
        .select('*')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });

      if (dealsError) throw dealsError;

      setEarnings(earningsData || []);

      // Calculate stats
      const totalEarnings = earningsData?.reduce((sum, earning) => sum + earning.commission_amount, 0) || 0;
      const pendingEarnings = earningsData?.filter(e => e.status === 'pending').reduce((sum, earning) => sum + earning.commission_amount, 0) || 0;
      const paidEarnings = earningsData?.filter(e => e.status === 'paid').reduce((sum, earning) => sum + earning.commission_amount, 0) || 0;
      const totalDeals = dealsData?.length || 0;
      const averageCommission = earningsData?.length > 0 ? totalEarnings / earningsData.length : 0;

      setStats({
        totalEarnings,
        pendingEarnings,
        paidEarnings,
        totalDeals,
        averageCommission
      });

    } catch (error) {
      console.error('Error fetching agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPitchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch pitch opportunities created by this agent or assigned to this agent
      const { data: opportunitiesData, error: opportunitiesError } = await supabase
        .from('pitch_opportunities')
        .select(`
          *,
          profiles!pitch_opportunities_assigned_agent_fkey (
            first_name,
            last_name,
            company_name
          )
        `)
        .or(`created_by.eq.${user.id},assigned_agent.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (opportunitiesError) throw opportunitiesError;

      // Fetch pitch submissions for opportunities created by this agent
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('pitch_submissions')
        .select(`
          *,
          tracks (
            title,
            genres,
            moods,
            bpm,
            duration,
            profiles!tracks_producer_id_fkey (
              first_name,
              last_name,
              company_name
            )
          ),
          pitch_opportunities (
            title,
            client_name
          )
        `)
        .in('opportunity_id', opportunitiesData?.map(opp => opp.id) || [])
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Transform opportunities data
      const transformedOpportunities = opportunitiesData?.map(opp => ({
        ...opp,
        assigned_agent_name: opp.profiles ? 
          (opp.profiles.first_name && opp.profiles.last_name ? 
            `${opp.profiles.first_name} ${opp.profiles.last_name}` : 
            opp.profiles.company_name) : null
      })) || [];

      // Transform submissions data
      const transformedSubmissions = submissionsData?.map(sub => {
        const track = sub.tracks;
        const producer = track?.profiles;
        const opportunity = sub.pitch_opportunities;
        
        // Extract playlist info from submission notes
        let playlistName = 'Individual Track';
        let playlistUrl = null;
        if (sub.submission_notes && sub.submission_notes.includes('Playlist submission:')) {
          const playlistMatch = sub.submission_notes.match(/Playlist submission: (.+?) - /);
          if (playlistMatch) {
            playlistName = playlistMatch[1];
          } else {
            playlistName = 'Playlist Submission';
          }
          const urlMatch = sub.submission_notes.match(/URL: (.+?)(?:\s|$)/);
          if (urlMatch) {
            playlistUrl = urlMatch[1];
          }
        }

        return {
          ...sub,
          track_title: track?.title || 'Unknown Track',
          track_genre: track?.genres?.[0] || 'Unknown',
          track_mood: track?.moods?.[0] || 'Unknown',
          track_bpm: track?.bpm || 0,
          track_duration: track?.duration || 0,
          producer_name: producer ? 
            (producer.first_name && producer.last_name ? 
              `${producer.first_name} ${producer.last_name}` : 
              producer.company_name) : 'Unknown Producer',
          artist_name: producer ? 
            (producer.first_name && producer.last_name ? 
              `${producer.first_name} ${producer.last_name}` : 
              producer.company_name) : 'Unknown Artist',
          opportunity_title: opportunity?.title || 'Unknown Opportunity',
          opportunity_client: opportunity?.client_name || 'Unknown Client',
          playlist_name: playlistName,
          playlist_url: playlistUrl
        };
      }) || [];

      setPitchOpportunities(transformedOpportunities);
      setPitchSubmissions(transformedSubmissions);

    } catch (error) {
      console.error('Error fetching pitch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'cancelled':
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

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading agent dashboard...</p>
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
                Welcome back, {profile?.first_name || profile?.company_name || user?.email || 'Agent'}
              </h1>
              <p className="text-gray-300 mt-1">
                Agent Dashboard
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchAgentData}
                disabled={loading}
                className="p-2 text-gray-300 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <Link
                to="/profile"
                className="p-2 text-gray-300 hover:text-white transition-colors"
              >
                <Users className="w-6 h-6" />
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
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Earnings</p>
                <p className="text-2xl font-bold text-white">${stats.totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Pending Earnings</p>
                <p className="text-2xl font-bold text-white">${stats.pendingEarnings.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Deals</p>
                <p className="text-2xl font-bold text-white">{stats.totalDeals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Avg Commission</p>
                <p className="text-2xl font-bold text-white">${stats.averageCommission.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'earnings'
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Earnings ({earnings.length})
          </button>
          <button
            onClick={() => setActiveTab('deals')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'deals'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Deals ({stats.totalDeals})
          </button>
          <button
            onClick={() => setActiveTab('pitch_management')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'pitch_management'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Music className="w-4 h-4 inline mr-2" />
            Pitch Service
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Quick Actions */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    to="/agent/custom-sync-request"
                    className="flex items-center p-3 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors group"
                  >
                    <FileText className="w-5 h-5 text-blue-400 mr-3" />
                    <span className="text-white">Create Custom Sync Request</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    to="/agent/custom-sync-request-subs"
                    className="flex items-center p-3 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg transition-colors group"
                  >
                    <BarChart3 className="w-5 h-5 text-purple-400 mr-3" />
                    <span className="text-white">View Submissions</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    to="/agent/revenue-report"
                    className="flex items-center p-3 bg-green-600/20 hover:bg-green-600/30 rounded-lg transition-colors group"
                  >
                    <DollarSign className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-white">Revenue Report</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    to="/agent/banking"
                    className="flex items-center p-3 bg-indigo-600/20 hover:bg-indigo-600/30 rounded-lg transition-colors group"
                  >
                    <Building2 className="w-5 h-5 text-indigo-400 mr-3" />
                    <span className="text-white">Agent Banking</span>
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

              {/* Recent Earnings */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Earnings</h3>
                {earnings.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No earnings yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Create custom sync requests to start earning commissions
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {earnings.slice(0, 5).map((earning) => (
                      <div
                        key={earning.id}
                        className="flex items-center p-3 bg-gray-800/30 rounded-lg"
                      >
                        {getStatusIcon(earning.status)}
                        <div className="ml-3 flex-1">
                          <p className="text-white font-medium">{earning.custom_sync_request?.project_title || 'Unknown Project'}</p>
                          <p className="text-sm text-gray-400">
                            {earning.commission_percentage}% commission
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-400">
                            ${earning.commission_amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(earning.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-6">All Earnings</h3>
              {earnings.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No earnings found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {earnings.map((earning) => (
                    <div
                      key={earning.id}
                      className="flex items-center p-4 bg-gray-800/30 rounded-lg"
                    >
                      {getStatusIcon(earning.status)}
                      <div className="ml-4 flex-1">
                        <p className="text-white font-medium">{earning.custom_sync_request?.project_title || 'Unknown Project'}</p>
                        <p className="text-sm text-gray-400">
                          Deal: ${earning.total_deal_amount.toFixed(2)} • Commission: {earning.commission_percentage}%
                        </p>
                        <p className="text-xs text-gray-500">
                          Created: {formatDate(earning.created_at)}
                          {earning.paid_at && ` • Paid: ${formatDate(earning.paid_at)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${getStatusColor(earning.status)}`}>
                          ${earning.commission_amount.toFixed(2)}
                        </p>
                        <p className={`text-sm ${getStatusColor(earning.status)}`}>
                          {earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'deals' && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-6">Your Deals</h3>
              <p className="text-gray-400 mb-4">
                This section will show all custom sync requests you've created as an agent.
              </p>
              {/* TODO: Add deals list when we have the data */}
            </div>
          )}

          {activeTab === 'pitch_management' && (
            <div className="space-y-6">
              {/* Pitch Opportunities Section */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h3 className="text-lg font-semibold text-white">Your Pitch Briefs</h3>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Search briefs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                    />
                    <button
                      onClick={() => setShowCreateBrief(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Brief
                    </button>
                  </div>
                </div>

                {pitchOpportunities.length === 0 ? (
                  <div className="text-center py-8">
                    <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No pitch briefs created yet</p>
                    <button
                      onClick={() => setShowCreateBrief(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Create Your First Brief
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pitchOpportunities
                      .filter(opportunity =>
                        opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        opportunity.client_name.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((opportunity) => (
                        <div key={opportunity.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-white font-semibold text-sm">{opportunity.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              opportunity.status === 'active' ? 'bg-green-500/20 text-green-400' :
                              opportunity.status === 'closed' ? 'bg-red-500/20 text-red-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {opportunity.status}
                            </span>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-gray-300 text-sm">
                              <Users className="w-4 h-4 mr-2" />
                              {opportunity.client_name}
                            </div>
                            {opportunity.deadline && (
                              <div className="flex items-center text-gray-300 text-sm">
                                <Calendar className="w-4 h-4 mr-2" />
                                {new Date(opportunity.deadline).toLocaleDateString()}
                              </div>
                            )}
                            {opportunity.budget_range && (
                              <div className="flex items-center text-gray-300 text-sm">
                                <DollarSign className="w-4 h-4 mr-2" />
                                {opportunity.budget_range}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-white">
                                {pitchSubmissions.filter(sub => sub.opportunity_id === opportunity.id).length}
                              </div>
                              <div className="text-xs text-gray-500">Submissions</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-white">
                                {pitchSubmissions.filter(sub => sub.opportunity_id === opportunity.id && sub.submission_status === 'selected').length}
                              </div>
                              <div className="text-xs text-gray-500">Selected</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-white">
                                {pitchSubmissions.filter(sub => sub.opportunity_id === opportunity.id && sub.submission_status === 'placed').length}
                              </div>
                              <div className="text-xs text-gray-500">Placed</div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedOpportunityForSubmission(opportunity);
                                setShowSubmitToBrief(true);
                              }}
                              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              <Send className="w-4 h-4 inline mr-1" />
                              Submit
                            </button>
                            <button
                              onClick={() => {
                                // TODO: Add view submissions functionality
                              }}
                              className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
                            >
                              <Eye className="w-4 h-4 inline mr-1" />
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Recent Submissions Section */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-6">Recent Submissions</h3>
                {pitchSubmissions.length === 0 ? (
                  <div className="text-center py-8">
                    <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No submissions yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Track</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brief</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {pitchSubmissions.slice(0, 10).map((submission) => (
                          <tr key={submission.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-white">{submission.track_title}</div>
                              <div className="text-sm text-gray-400">{submission.track_genre} • {submission.track_bpm} BPM</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {submission.producer_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {submission.opportunity_title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                submission.submission_status === 'submitted' ? 'bg-blue-500/20 text-blue-400' :
                                submission.submission_status === 'selected' ? 'bg-green-500/20 text-green-400' :
                                submission.submission_status === 'placed' ? 'bg-purple-500/20 text-purple-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {submission.submission_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {formatDate(submission.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateBrief && (
        <CreatePrivateBriefModal
          isOpen={showCreateBrief}
          onClose={() => setShowCreateBrief(false)}
          onBriefCreated={() => {
            fetchPitchData();
            setShowCreateBrief(false);
          }}
        />
      )}

      {showSubmitToBrief && selectedOpportunityForSubmission && (
        <SubmitToBriefModal
          isOpen={showSubmitToBrief}
          onClose={() => {
            setShowSubmitToBrief(false);
            setSelectedOpportunityForSubmission(null);
          }}
          opportunity={selectedOpportunityForSubmission}
          onSubmissionSent={() => {
            fetchPitchData();
            setShowSubmitToBrief(false);
            setSelectedOpportunityForSubmission(null);
          }}
        />
      )}
    </div>
  );
}
