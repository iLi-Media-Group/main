import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Plus
} from 'lucide-react';

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

export function CustomSyncRequestsPage() {
  const { user } = useUnifiedAuth();
  const [customSyncRequests, setCustomSyncRequests] = useState<CustomSyncRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchCustomSyncRequests();
    }
  }, [user]);

  const fetchCustomSyncRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
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
      setError('Failed to load custom sync requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-400/20';
      case 'in_progress':
        return 'text-blue-400 bg-blue-400/20';
      case 'open':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'cancelled':
        return 'text-red-400 bg-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'open':
        return <MessageSquare className="w-4 h-4" />;
      case 'cancelled':
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

  const filteredRequests = customSyncRequests.filter(request => {
    const matchesSearch = request.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.project_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.client.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading custom sync requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-900/90 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-blue-400 mr-2" />
            <h1 className="text-3xl font-bold text-white">Custom Sync Requests</h1>
          </div>
          <p className="text-gray-300">
            Manage custom sync licensing requests
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
                  placeholder="Search by project title, description, or client name..."
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
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={fetchCustomSyncRequests}
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

        {/* Requests Grid */}
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-white">{request.project_title}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1">{request.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">
                        {request.client.first_name} {request.client.last_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">${request.sync_fee}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{request.genre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{formatDate(request.created_at)}</span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-400">
                    <p><strong>Description:</strong> {request.project_description}</p>
                    <p><strong>Sub-genres:</strong> {Array.isArray(request.sub_genres) ? request.sub_genres.join(', ') : 'None'}</p>
                    <p><strong>End Date:</strong> {formatDate(request.end_date)}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Link
                    to={`/custom-sync-request/${request.id}`}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-center"
                  >
                    View Details
                  </Link>
                  {request.status === 'open' && (
                    <Link
                      to={`/producer-sync-submission?requestId=${request.id}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center"
                    >
                      Submit Track
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredRequests.length === 0 && !loading && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Custom Sync Requests Found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Custom sync requests will appear here when clients select you as their preferred producer'
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
