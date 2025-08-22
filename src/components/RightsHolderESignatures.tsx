import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { supabase } from '../lib/supabase';
import { 
  Mail as MailIcon, 
  UserPlus, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Send, 
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Download,
  FileText,
  Users,
  Calendar,
  Search,
  Filter,
  Plus,
  X,
  Save,
  Copy,
  Share2,
  ExternalLink,
  Phone,
  AtSign,
  Building2,
  Music
} from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  genres: string[];
  sub_genres: string[];
  moods: string[];
  bpm: number;
  key: string;
  duration: number;
  description: string;
  audio_url: string;
  image_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
  track_producer_id: string;
  has_vocals: boolean;
  is_sync_only: boolean;
  master_rights_owner?: string;
  publishing_rights_owner?: string;
  split_sheet_url?: string;
}

export function RightsHolderESignatures() {
  const { user } = useUnifiedAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  // Fetch tracks on component mount
  useEffect(() => {
    if (user) {
      fetchTracks();
    }
  }, [user]);

  const fetchTracks = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .eq('track_producer_id', user.id)
        .order('created_at', { ascending: false });

      if (tracksError) throw tracksError;

      setTracks(tracksData || []);
    } catch (err) {
      console.error('Error fetching tracks:', err);
      setError('Failed to load tracks');
    } finally {
      setLoading(false);
    }
  };

  const filteredTracks = tracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         track.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || track.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
            <span className="ml-3 text-lg">Loading tracks...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">E-Signatures & Split Sheets</h1>
            <p className="text-gray-400 mt-2">Manage split sheets and e-signatures for your tracks</p>
          </div>
          <button
            onClick={fetchTracks}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                placeholder="Search tracks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
          </div>
          <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              </select>
          </div>
        </div>

        {/* Tracks Grid */}
        {filteredTracks.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No tracks found</h3>
            <p className="text-gray-500">Upload tracks to manage split sheets and e-signatures</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTracks.map((track) => (
              <div key={track.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                {/* Track Image */}
                <div className="relative mb-4">
                  <img
                    src={track.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop'}
                    alt={track.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      track.status === 'active' ? 'bg-green-600' :
                      track.status === 'pending' ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}>
                      {track.status}
                    </span>
                </div>
              </div>

                {/* Track Info */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{track.title}</h3>
                  <p className="text-gray-400">{track.artist}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{track.bpm} BPM</span>
                    <span>{track.key}</span>
                    {track.duration && <span>{formatDuration(track.duration)}</span>}
                </div>

                  <div className="text-sm text-gray-400">
                    <p><strong>Genres:</strong> {track.genres.join(', ')}</p>
                    <p><strong>Moods:</strong> {track.moods.join(', ')}</p>
              </div>

                  {track.master_rights_owner && (
                    <div className="text-sm text-blue-400">
                      <p><strong>Master Rights:</strong> {track.master_rights_owner}</p>
                    </div>
                  )}

                  {track.publishing_rights_owner && (
                    <div className="text-sm text-purple-400">
                      <p><strong>Publishing Rights:</strong> {track.publishing_rights_owner}</p>
                    </div>
                  )}

                  {track.split_sheet_url && (
                    <div className="flex items-center text-sm text-green-400">
                      <FileText className="w-4 h-4 mr-1" />
                      Split Sheet Available
                  </div>
                  )}
              </div>

              {/* Actions */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                  <div className="flex space-x-2">
                <button
                      onClick={() => setSelectedTrack(track)}
                      className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      title="View Details"
                >
                      <Eye className="w-4 h-4" />
                </button>
                    {track.split_sheet_url && (
                <button
                        onClick={() => window.open(track.split_sheet_url, '_blank')}
                        className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                        title="Download Split Sheet"
                      >
                        <Download className="w-4 h-4" />
                </button>
                    )}
              </div>
                  <span className="text-xs text-gray-500">
                    {new Date(track.created_at).toLocaleDateString()}
                  </span>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* Track Detail Modal */}
        {selectedTrack && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Track Details</h3>
                <button
                  onClick={() => setSelectedTrack(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4">Track Information</h4>
                  <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400">Title</label>
                      <p className="text-white">{selectedTrack.title}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Artist</label>
                      <p className="text-white">{selectedTrack.artist}</p>
                  </div>
                  <div>
                      <label className="text-sm text-gray-400">Genres</label>
                      <p className="text-white">{selectedTrack.genres.join(', ')}</p>
                  </div>
                    <div>
                      <label className="text-sm text-gray-400">Moods</label>
                      <p className="text-white">{selectedTrack.moods.join(', ')}</p>
                </div>
                    <div>
                      <label className="text-sm text-gray-400">BPM</label>
                      <p className="text-white">{selectedTrack.bpm}</p>
              </div>
                    <div>
                      <label className="text-sm text-gray-400">Key</label>
                      <p className="text-white">{selectedTrack.key}</p>
                </div>
                    {selectedTrack.duration && (
                        <div>
                        <label className="text-sm text-gray-400">Duration</label>
                        <p className="text-white">{formatDuration(selectedTrack.duration)}</p>
                        </div>
                    )}
                        </div>
                      </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4">Rights Information</h4>
                  <div className="space-y-3">
                    {selectedTrack.master_rights_owner && (
                      <div>
                        <label className="text-sm text-gray-400">Master Rights Owner</label>
                        <p className="text-white">{selectedTrack.master_rights_owner}</p>
                      </div>
                    )}
                    {selectedTrack.publishing_rights_owner && (
                        <div>
                        <label className="text-sm text-gray-400">Publishing Rights Owner</label>
                        <p className="text-white">{selectedTrack.publishing_rights_owner}</p>
                        </div>
                    )}
                        <div>
                      <label className="text-sm text-gray-400">Status</label>
                      <p className="text-white">{selectedTrack.status}</p>
                        </div>
                    {selectedTrack.description && (
                        <div>
                        <label className="text-sm text-gray-400">Description</label>
                        <p className="text-white">{selectedTrack.description}</p>
                      </div>
                    )}
                  </div>
                        </div>
                      </div>

              {selectedTrack.split_sheet_url && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h4 className="text-lg font-semibold mb-4">Split Sheet</h4>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-300">Split sheet is available for this track</p>
                          <button
                      onClick={() => window.open(selectedTrack.split_sheet_url, '_blank')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Split Sheet
                        </button>
                      </div>
                    </div>
              )}

              <div className="flex justify-end mt-6 pt-6 border-t border-gray-700">
                <button
                  onClick={() => setSelectedTrack(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
