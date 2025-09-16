import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { 
  Calendar, 
  Mail, 
  Music, 
  Users, 
  TrendingUp, 
  Send, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  Play,
  X
} from 'lucide-react';
import { DealTrackingModal } from './DealTrackingModal';
import { CreatePrivateBriefModal } from './CreatePrivateBriefModal';
import { SubmitToBriefModal } from './SubmitToBriefModal';

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
}

interface PitchPlaylist {
  id: string;
  opportunity_id: string;
  playlist_name: string;
  submission_email: string;
  submission_instructions: string;
  tracks_included: string[];
  submission_status: string;
  sent_at: string;
  delivered_at: string;
  opened_at: string;
  response_received: boolean;
  response_notes: string;
  created_at: string;
  opportunity_title: string;
  client_name: string;
}


export function PitchManagement() {
  const { user } = useUnifiedAuth();
  const [activeTab, setActiveTab] = useState<'opportunities' | 'track_submissions' | 'playlists' | 'analytics'>('opportunities');
  const [opportunities, setOpportunities] = useState<PitchOpportunity[]>([]);
  const [submissions, setSubmissions] = useState<PitchSubmission[]>([]);
  const [playlists, setPlaylists] = useState<PitchPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<PitchOpportunity | null>(null);
  const [showDealTracking, setShowDealTracking] = useState(false);
  const [dealTrackingData, setDealTrackingData] = useState<{
    submissionId: string;
    trackTitle: string;
    producerName: string;
    clientName: string;
  } | null>(null);
  const [showCreateBrief, setShowCreateBrief] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSubmitToBrief, setShowSubmitToBrief] = useState(false);
  const [selectedOpportunityForSubmission, setSelectedOpportunityForSubmission] = useState<PitchOpportunity | null>(null);
  const [selectedOpportunityForView, setSelectedOpportunityForView] = useState<PitchOpportunity | null>(null);

  // Filter opportunities based on search term
  const filteredOpportunities = opportunities.filter(opportunity =>
    opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opportunity.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opportunity.client_company && opportunity.client_company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (opportunity.assigned_agent_name && opportunity.assigned_agent_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter submissions and playlists by selected opportunity
  const filteredSubmissions = selectedOpportunityForView 
    ? submissions.filter(sub => sub.opportunity_id === selectedOpportunityForView.id)
    : submissions;

  const filteredPlaylists = selectedOpportunityForView
    ? playlists.filter(playlist => playlist.opportunity_id === selectedOpportunityForView.id)
    : playlists;


  // Fetch all pitch data
  const fetchPitchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch opportunities with submission counts and assigned agent info
      console.log('Fetching opportunities for user:', user.id);
      
      const { data: opportunitiesData, error: opportunitiesError } = await supabase
        .from('pitch_opportunities')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      console.log('Opportunities fetch result:', { opportunitiesData, opportunitiesError });

      if (opportunitiesError) {
        console.error('Error fetching opportunities:', opportunitiesError);
      } else {
        // Transform opportunities data to include submission counts
        const transformedOpportunities = (opportunitiesData || []).map(opp => ({
          ...opp,
          assigned_agent_name: null, // Will be populated later if needed
          // Add default submission counts since we're not using the view
          total_submissions: 0,
          selected_submissions: 0,
          placed_submissions: 0
        }));
        setOpportunities(transformedOpportunities);
      }

      // Fetch submissions with track, user, and opportunity details
      console.log('Fetching submissions...');
      
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('pitch_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Submissions fetch result:', { submissionsData, submissionsError });

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
      } else {
        // Transform submissions data
        const transformedSubmissions = (submissionsData || []).map(sub => ({
          ...sub,
          track_title: 'Unknown Track', // Will be populated later if needed
          track_genre: 'Unknown',
          track_mood: 'Unknown',
          track_bpm: 0,
          track_duration: 0,
          producer_name: 'Unknown',
          artist_name: 'Unknown',
          opportunity_title: 'Unknown Opportunity',
          opportunity_client: 'Unknown Client'
        }));
        setSubmissions(transformedSubmissions);
      }

      // Fetch playlists with opportunity details (from main playlists table)
      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select(`
          id,
          name,
          description,
          created_at
        `)
        .eq('producer_id', user.id)
        .order('created_at', { ascending: false });

      if (playlistsError) {
        console.error('Error fetching playlists:', playlistsError);
      } else {
        // Transform playlists data
        const transformedPlaylists = (playlistsData || []).map(playlist => ({
          ...playlist,
          opportunity_title: 'General Playlist', // These are general playlists, not opportunity-specific
          client_name: 'N/A'
        }));
        setPlaylists(transformedPlaylists);
      }

    } catch (error) {
      console.error('Error fetching pitch data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPitchData();
  }, [fetchPitchData]);


  const handleUpdateSubmissionStatus = async (submissionId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('pitch_submissions')
        .update({ submission_status: status })
        .eq('id', submissionId);

      if (error) {
        console.error('Error updating submission status:', error);
      } else {
        fetchPitchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating submission status:', error);
    }
  };

  const handleTrackDeal = (submission: PitchSubmission) => {
    setDealTrackingData({
      submissionId: submission.id,
      trackTitle: submission.track_title,
      producerName: submission.producer_name,
      clientName: 'Client' // We'll need to get this from the opportunity
    });
    setShowDealTracking(true);
  };

  const handleSubmitToBrief = (opportunity: PitchOpportunity) => {
    setSelectedOpportunityForSubmission(opportunity);
    setShowSubmitToBrief(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'selected': return 'text-blue-600 bg-blue-100';
      case 'placed': return 'text-purple-600 bg-purple-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'submitted': return 'text-yellow-600 bg-yellow-100';
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'opened': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'selected': return <CheckCircle className="w-4 h-4" />;
      case 'placed': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'submitted': return <Clock className="w-4 h-4" />;
      case 'sent': return <Send className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'opened': return <Eye className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Pitch Service Management</h2>
          <p className="text-white">Manage pitch opportunities, submissions, and playlists</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'opportunities', label: 'Opportunities', icon: Calendar },
            { id: 'track_submissions', label: 'Track Submissions', icon: Music },
            { id: 'playlists', label: 'Playlists', icon: FileText },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'opportunities' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-semibold text-white">Pitch Opportunities</h3>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search by title, client, or agent..."
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

            {/* Selected Opportunity Details */}
            {selectedOpportunity && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-xl font-bold text-white">{selectedOpportunity.title}</h4>
                    <p className="text-gray-300">{selectedOpportunity.client_name}</p>
                    {selectedOpportunity.client_company && (
                      <p className="text-gray-400">{selectedOpportunity.client_company}</p>
                    )}
                    {selectedOpportunity.assigned_agent_name && (
                      <p className="text-gray-400">Agent: {selectedOpportunity.assigned_agent_name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedOpportunity(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Brief Details Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium text-white mb-2">Brief Description</h5>
                      <p className="text-gray-300 text-sm">
                        {selectedOpportunity.description || 'No description provided'}
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-white mb-2">Brief Type</h5>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {selectedOpportunity.brief_type}
                      </span>
                    </div>

                    {selectedOpportunity.genre_requirements && selectedOpportunity.genre_requirements.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-white mb-2">Genre Requirements</h5>
                        <div className="flex flex-wrap gap-1">
                          {selectedOpportunity.genre_requirements.map((genre, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedOpportunity.mood_requirements && selectedOpportunity.mood_requirements.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-white mb-2">Mood Requirements</h5>
                        <div className="flex flex-wrap gap-1">
                          {selectedOpportunity.mood_requirements.map((mood, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {mood}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {selectedOpportunity.deadline && (
                      <div>
                        <h5 className="text-sm font-medium text-white mb-2">Deadline</h5>
                        <p className="text-gray-300 text-sm">
                          {new Date(selectedOpportunity.deadline).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}

                    <div>
                      <h5 className="text-sm font-medium text-white mb-2">Submission Email</h5>
                      <p className="text-gray-300 text-sm">{selectedOpportunity.submission_email}</p>
                    </div>

                    {selectedOpportunity.submission_instructions && (
                      <div>
                        <h5 className="text-sm font-medium text-white mb-2">Submission Instructions</h5>
                        <p className="text-gray-300 text-sm">{selectedOpportunity.submission_instructions}</p>
                      </div>
                    )}

                    {selectedOpportunity.budget_range && (
                      <div>
                        <h5 className="text-sm font-medium text-white mb-2">Budget Range</h5>
                        <p className="text-gray-300 text-sm">{selectedOpportunity.budget_range}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-white mb-2">Track Submissions</h5>
                    <div className="text-2xl font-bold text-white">
                      {submissions.filter(sub => sub.opportunity_id === selectedOpportunity.id).length}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-white mb-2">Playlists Created</h5>
                    <div className="text-2xl font-bold text-white">
                      {playlists.filter(playlist => playlist.opportunity_id === selectedOpportunity.id).length}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Selected Tracks</h5>
                    <div className="text-2xl font-bold text-green-400">
                      {submissions.filter(sub => 
                        sub.opportunity_id === selectedOpportunity.id && 
                        sub.submission_status === 'selected'
                      ).length}
                    </div>
                  </div>
                </div>

                {/* Track Submissions for this Opportunity */}
                <div className="mb-6">
                  <h5 className="text-lg font-semibold text-white mb-3">Track Submissions</h5>
                  {submissions.filter(sub => sub.opportunity_id === selectedOpportunity.id).length === 0 ? (
                    <p className="text-gray-400">No track submissions yet</p>
                  ) : (
                    <div className="space-y-2">
                      {submissions.filter(sub => sub.opportunity_id === selectedOpportunity.id).map((submission) => (
                        <div key={submission.id} className="bg-white/5 rounded-lg p-4 flex justify-between items-center">
                          <div>
                            <div className="font-medium text-white">{submission.track_title}</div>
                            <div className="text-sm text-gray-400">
                              {submission.track_genre} • {submission.track_bpm} BPM • {submission.producer_name}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.submission_status)}`}>
                              {submission.submission_status}
                            </span>
                            <select
                              value={submission.submission_status}
                              onChange={(e) => handleUpdateSubmissionStatus(submission.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                            >
                              <option value="submitted">Submitted</option>
                              <option value="selected">Selected</option>
                              <option value="placed">Placed</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Playlists for this Opportunity */}
                <div>
                  <h5 className="text-lg font-semibold text-white mb-3">Playlists</h5>
                  {playlists.filter(playlist => playlist.opportunity_id === selectedOpportunity.id).length === 0 ? (
                    <p className="text-gray-400">No playlists created yet</p>
                  ) : (
                    <div className="space-y-2">
                      {playlists.filter(playlist => playlist.opportunity_id === selectedOpportunity.id).map((playlist) => (
                        <div key={playlist.id} className="bg-white/5 rounded-lg p-4 flex justify-between items-center">
                          <div>
                            <div className="font-medium text-white">{playlist.playlist_name}</div>
                            <div className="text-sm text-gray-400">
                              {playlist.tracks_included.length} tracks • {playlist.submission_status}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
                              Send Email
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {filteredOpportunities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">
                  {searchTerm ? `No opportunities found matching "${searchTerm}"` : 'No opportunities available'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOpportunities.map((opportunity) => (
                <div key={opportunity.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{opportunity.title}</h3>
                      <p className="text-sm text-gray-600">{opportunity.client_name}</p>
                      {opportunity.client_company && (
                        <p className="text-sm text-gray-500">{opportunity.client_company}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(opportunity.status)}`}>
                      {opportunity.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      Deadline: {new Date(opportunity.deadline).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      {opportunity.submission_email}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Music className="w-4 h-4 mr-2" />
                      {opportunity.genre_requirements.join(', ')}
                    </div>
                    {opportunity.assigned_agent_name && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        Agent: {opportunity.assigned_agent_name}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{opportunity.total_submissions}</div>
                      <div className="text-xs text-gray-500">Submissions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{opportunity.selected_submissions}</div>
                      <div className="text-xs text-gray-500">Selected</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{opportunity.placed_submissions}</div>
                      <div className="text-xs text-gray-500">Placed</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOpportunity(opportunity);
                        }}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                    <button
                      onClick={() => handleSubmitToBrief(opportunity)}
                      className="w-full bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors flex items-center justify-center"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit to Brief
                    </button>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'track_submissions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Track Submissions</h3>
              {selectedOpportunityForView && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-300">Filtered by:</span>
                  <span className="text-sm font-medium text-white">{selectedOpportunityForView.title}</span>
                  <button
                    onClick={() => setSelectedOpportunityForView(null)}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Track</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opportunity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{submission.track_title}</div>
                          <div className="text-sm text-gray-500">{submission.track_genre} • {submission.track_bpm} BPM</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {opportunities.find(opp => opp.id === submission.opportunity_id)?.title || 'Unknown Opportunity'}
                          </div>
                          <div className="text-gray-500">
                            {opportunities.find(opp => opp.id === submission.opportunity_id)?.client_name || 'Unknown Client'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.producer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.submission_status)}`}>
                          {getStatusIcon(submission.submission_status)}
                          <span className="ml-1">{submission.submission_status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <select
                            value={submission.submission_status}
                            onChange={(e) => handleUpdateSubmissionStatus(submission.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="submitted">Submitted</option>
                            <option value="selected">Selected</option>
                            <option value="placed">Placed</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <button
                            onClick={() => handleTrackDeal(submission)}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors flex items-center"
                            title="Track Deal"
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            Deal
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'playlists' && (
          <div className="space-y-4">
            {playlists.map((playlist) => (
              <div key={playlist.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{playlist.playlist_name}</h3>
                    <p className="text-sm text-gray-600">{playlist.opportunity_title}</p>
                    <p className="text-sm text-gray-500">Client: {playlist.client_name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(playlist.submission_status)}`}>
                    {playlist.submission_status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-500">Tracks</div>
                    <div className="text-lg font-semibold">{playlist.tracks_included.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Sent</div>
                    <div className="text-lg font-semibold">
                      {playlist.sent_at ? new Date(playlist.sent_at).toLocaleDateString() : 'Not sent'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Delivered</div>
                    <div className="text-lg font-semibold">
                      {playlist.delivered_at ? new Date(playlist.delivered_at).toLocaleDateString() : 'Not delivered'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Opened</div>
                    <div className="text-lg font-semibold">
                      {playlist.opened_at ? new Date(playlist.opened_at).toLocaleDateString() : 'Not opened'}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center">
                    <Send className="w-4 h-4 mr-2" />
                    Send Email
                  </button>
                  <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Music className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{opportunities.length}</div>
                  <div className="text-sm text-gray-500">Active Opportunities</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{submissions.length}</div>
                  <div className="text-sm text-gray-500">Total Submissions</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{playlists.length}</div>
                  <div className="text-sm text-gray-500">Playlists Created</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {submissions.filter(s => s.submission_status === 'placed').length}
                  </div>
                  <div className="text-sm text-gray-500">Successful Placements</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}

      {showDealTracking && dealTrackingData && (
        <DealTrackingModal
          isOpen={showDealTracking}
          onClose={() => {
            setShowDealTracking(false);
            setDealTrackingData(null);
          }}
          submissionId={dealTrackingData.submissionId}
          trackTitle={dealTrackingData.trackTitle}
          producerName={dealTrackingData.producerName}
          clientName={dealTrackingData.clientName}
          onDealUpdated={fetchPitchData}
        />
      )}

      {showCreateBrief && (
        <CreatePrivateBriefModal
          isOpen={showCreateBrief}
          onClose={() => setShowCreateBrief(false)}
          onBriefCreated={fetchPitchData}
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
          onSubmissionSent={fetchPitchData}
        />
      )}
    </div>
  );
}
