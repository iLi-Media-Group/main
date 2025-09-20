import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { supabase } from '../lib/supabase';
import { 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter,
  RefreshCw,
  DollarSign,
  Calendar,
  User,
  ArrowLeft
} from 'lucide-react';

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

export function SyncProposalsPage() {
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();
  const [syncProposals, setSyncProposals] = useState<SyncProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchSyncProposals();
    }
  }, [user]);

  const fetchSyncProposals = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
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
      setError('Failed to load sync proposals');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredProposals = syncProposals.filter(proposal => {
    const matchesSearch = proposal.track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.track.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.client.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading sync proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-900/90 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 text-blue-400 mr-2" />
              <h1 className="text-3xl font-bold text-white">Sync Proposals</h1>
            </div>
          </div>
          <Link
            to="/rights-holder/dashboard"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Dashboard
          </Link>
        </div>
        <div className="text-center mb-6">
          <p className="text-gray-300">
            Manage sync licensing proposals for your tracks
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by track title, artist, or client name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={fetchSyncProposals}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Proposals Grid */}
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <div
              key={proposal.id}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-white">{proposal.track.title}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(proposal.status)}`}>
                      {getStatusIcon(proposal.status)}
                      <span className="ml-1">{proposal.status}</span>
                    </div>
                    {proposal.is_urgent && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                        Urgent
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">
                        {proposal.client.first_name} {proposal.client.last_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">${proposal.sync_fee}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{proposal.project_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{formatDate(proposal.created_at)}</span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-400">
                    <p><strong>Track:</strong> {proposal.track.artist}</p>
                    <p><strong>Payment Terms:</strong> {proposal.payment_terms}</p>
                    <p><strong>Exclusive:</strong> {proposal.is_exclusive ? 'Yes' : 'No'}</p>
                    <p><strong>Expires:</strong> {formatDate(proposal.expiration_date)}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Link
                    to={`/sync-proposal/${proposal.id}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center"
                  >
                    View Details
                  </Link>
                  {proposal.status === 'pending' && (
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                      Respond
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProposals.length === 0 && !loading && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Sync Proposals Found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Sync proposals will appear here when clients request your tracks'
              }
            </p>
            <Link
              to="/rights-holder/dashboard"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
