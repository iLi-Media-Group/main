import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { supabase } from '../lib/supabase';
import { 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  DollarSign,
  Calendar,
  User,
  FileText,
  Music,
  Upload,
  Send,
  ArrowLeft
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

interface SyncSubmission {
  id: string;
  sync_request_id: string;
  producer_id: string;
  track_title: string;
  track_url: string;
  trackouts_url?: string;
  stems_url?: string;
  split_sheet_url?: string;
  notes?: string;
  created_at: string;
  producer: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export function CustomSyncRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUnifiedAuth();
  const [request, setRequest] = useState<CustomSyncRequest | null>(null);
  const [submissions, setSubmissions] = useState<SyncSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && user) {
      fetchRequestDetails();
    }
  }, [id, user]);

  const fetchRequestDetails = async () => {
    if (!id || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch request details
      const { data: requestData, error: requestError } = await supabase
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
        .eq('id', id)
        .single();
      
      if (requestError) throw requestError;
      
      setRequest(requestData);
      
      // Fetch submissions for this request
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('sync_submissions')
        .select(`
          *,
          producer:profiles!sync_submissions_producer_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('sync_request_id', id)
        .order('created_at', { ascending: false });
      
      if (submissionsError) throw submissionsError;
      
      setSubmissions(submissionsData || []);
    } catch (error) {
      console.error('Error fetching request details:', error);
      setError('Failed to load request details');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">{error || 'Request not found'}</p>
          <Link
            to="/custom-sync-requests"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requests
          </Link>
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
            <Link
              to="/custom-sync-requests"
              className="mr-4 p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">{request.project_title}</h1>
              <p className="text-gray-300">Custom Sync Request Details</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchRequestDetails}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            {request.status === 'open' && (
              <Link
                to={`/producer-sync-submission?requestId=${request.id}`}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                Submit Track
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Request Details */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Request Information</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(request.status)}`}>
                  {getStatusIcon(request.status)}
                  <span className="ml-1">{request.status.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Project Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400">Project Title</label>
                      <p className="text-white font-medium">{request.project_title}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Description</label>
                      <p className="text-white">{request.project_description}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Genre</label>
                      <p className="text-white">{request.genre}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Sub-genres</label>
                      <p className="text-white">
                        {Array.isArray(request.sub_genres) && request.sub_genres.length > 0 
                          ? request.sub_genres.join(', ') 
                          : 'None specified'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Financial & Timeline</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400">Sync Fee</label>
                      <p className="text-white font-medium">${request.sync_fee}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">End Date</label>
                      <p className="text-white">{formatDate(request.end_date)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Created</label>
                      <p className="text-white">{formatDate(request.created_at)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Last Updated</label>
                      <p className="text-white">{formatDate(request.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Client Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Name</label>
                  <p className="text-white font-medium">
                    {request.client.first_name} {request.client.last_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Email</label>
                  <p className="text-white">{request.client.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">Track Submissions</h2>
              
              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No submissions yet</p>
                  {request.status === 'open' && (
                    <Link
                      to={`/producer-sync-submission?requestId=${request.id}`}
                      className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors mt-4"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Track
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="bg-gray-800/30 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">{submission.track_title}</h4>
                        <span className="text-xs text-gray-400">
                          {formatDate(submission.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">
                        by {submission.producer.first_name} {submission.producer.last_name}
                      </p>
                      <div className="flex gap-2">
                        <a
                          href={submission.track_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                        >
                          Listen
                        </a>
                        {submission.notes && (
                          <button className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors">
                            Notes
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
