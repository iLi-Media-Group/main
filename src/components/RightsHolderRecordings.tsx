import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { supabase } from '../lib/supabase';
import { 
  Music, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  RefreshCw,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Upload,
  Calendar,
  User,
  FileText,
  Settings,
  Plus,
  X,
  Save,
  Copy,
  Share2,
  BarChart3
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
}

interface EditFormData {
  title: string;
  artist: string;
  genre: string;
  mood: string;
  bpm: number;
  key: string;
  description: string;
}

export function RightsHolderRecordings() {
  const { user } = useUnifiedAuth();
  const [recordings, setRecordings] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRecording, setSelectedRecording] = useState<Track | null>(null);
  const [editingRecording, setEditingRecording] = useState<Track | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    title: '',
    artist: '',
    genre: '',
    mood: '',
    bpm: 0,
    key: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  // Fetch recordings on component mount
  useEffect(() => {
    if (user) {
      fetchRecordings();
    }
  }, [user]);

  const fetchRecordings = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data: recordingsData, error: recordingsError } = await supabase
        .from('tracks')
        .select('*')
        .eq('track_producer_id', user.id)
        .order('created_at', { ascending: false });

      if (recordingsError) throw recordingsError;

      setRecordings(recordingsData || []);
    } catch (err) {
      console.error('Error fetching recordings:', err);
      setError('Failed to load recordings');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (recording: Track) => {
    setEditingRecording(recording);
    setEditFormData({
      title: recording.title,
      artist: recording.artist,
      genre: recording.genres.join(', '),
      mood: recording.moods.join(', '),
      bpm: recording.bpm,
      key: recording.key,
      description: recording.description
    });
  };

  const handleSave = async () => {
    if (!editingRecording) return;

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('tracks')
        .update({
          title: editFormData.title,
          artist: editFormData.artist,
          genres: [editFormData.genre],
          moods: [editFormData.mood],
          bpm: editFormData.bpm,
          key: editFormData.key,
          description: editFormData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRecording.id);

      if (updateError) throw updateError;

      // Update local state
      setRecordings(prev => prev.map(rec => 
        rec.id === editingRecording.id 
          ? { 
              ...rec, 
              title: editFormData.title,
              artist: editFormData.artist,
              genres: [editFormData.genre],
              moods: [editFormData.mood],
              bpm: editFormData.bpm,
              key: editFormData.key,
              description: editFormData.description,
              updated_at: new Date().toISOString() 
            }
          : rec
      ));

      setEditingRecording(null);
      setEditFormData({
        title: '',
        artist: '',
        genre: '',
        mood: '',
        bpm: 0,
        key: '',
        description: ''
      });
    } catch (err) {
      console.error('Error updating recording:', err);
      setError('Failed to update recording');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (recordingId: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('tracks')
        .delete()
        .eq('id', recordingId);

      if (deleteError) throw deleteError;

      setRecordings(prev => prev.filter(rec => rec.id !== recordingId));
    } catch (err) {
      console.error('Error deleting recording:', err);
      setError('Failed to delete recording');
    }
  };

  const filteredRecordings = recordings.filter(recording => {
    const matchesSearch = recording.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recording.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || recording.status === statusFilter;
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
            <span className="ml-3 text-lg">Loading recordings...</span>
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
            <h1 className="text-3xl font-bold">Manage Recordings</h1>
            <p className="text-gray-400 mt-2">Manage your uploaded tracks and recordings</p>
          </div>
          <button
            onClick={fetchRecordings}
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
                placeholder="Search recordings..."
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

        {/* Recordings Grid */}
        {filteredRecordings.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No recordings found</h3>
            <p className="text-gray-500">Upload your first track to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecordings.map((recording) => (
              <div key={recording.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                {/* Track Image */}
                <div className="relative mb-4">
                  <img
                    src={recording.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop'}
                    alt={recording.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      recording.status === 'active' ? 'bg-green-600' :
                      recording.status === 'pending' ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}>
                      {recording.status}
                    </span>
                  </div>
                </div>

                {/* Track Info */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{recording.title}</h3>
                  <p className="text-gray-400">{recording.artist}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{recording.bpm} BPM</span>
                    <span>{recording.key}</span>
                    {recording.duration && <span>{formatDuration(recording.duration)}</span>}
                  </div>

                  <div className="text-sm text-gray-400">
                    <p><strong>Genres:</strong> {recording.genres.join(', ')}</p>
                    <p><strong>Moods:</strong> {recording.moods.join(', ')}</p>
                  </div>

                  {recording.has_vocals && (
                    <div className="flex items-center text-sm text-blue-400">
                      <User className="w-4 h-4 mr-1" />
                      Has Vocals
                    </div>
                  )}

                  {recording.is_sync_only && (
                    <div className="flex items-center text-sm text-purple-400">
                      <Music className="w-4 h-4 mr-1" />
                      Sync Only
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(recording)}
                      className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(recording.id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(recording.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingRecording && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Edit Recording</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Artist</label>
                  <input
                    type="text"
                    value={editFormData.artist}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, artist: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Genre</label>
                  <input
                    type="text"
                    value={editFormData.genre}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, genre: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Mood</label>
                  <input
                    type="text"
                    value={editFormData.mood}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, mood: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">BPM</label>
                  <input
                    type="number"
                    value={editFormData.bpm}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, bpm: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Key</label>
                  <input
                    type="text"
                    value={editFormData.key}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, key: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditingRecording(null)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg transition-colors flex items-center"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
