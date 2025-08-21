import React, { useState, useEffect } from 'react';
import { useRightsHolderAuth } from '../contexts/RightsHolderAuthContext';
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

interface MasterRecording {
  id: string;
  title: string;
  artist: string;
  genre: string;
  mood: string;
  bpm: number;
  key: string;
  duration: number;
  description: string;
  audio_url: string;
  artwork_url?: string;
  status: 'pending' | 'verified' | 'rejected' | 'active';
  verification_notes?: string;
  created_at: string;
  updated_at: string;
  publishing_rights?: {
    id: string;
    master_recording_id: string;
    publishing_owner: string;
    publishing_percentage: number;
  };
  split_sheet?: {
    id: string;
    status: 'pending_signatures' | 'completed' | 'expired';
    participants: any[];
  };
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
  const { rightsHolder } = useRightsHolderAuth();
  const [recordings, setRecordings] = useState<MasterRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRecording, setSelectedRecording] = useState<MasterRecording | null>(null);
  const [editingRecording, setEditingRecording] = useState<MasterRecording | null>(null);
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
    if (rightsHolder) {
      fetchRecordings();
    }
  }, [rightsHolder]);

  const fetchRecordings = async () => {
    if (!rightsHolder) return;

    setLoading(true);
    setError(null);

    try {
      const { data: recordingsData, error: recordingsError } = await supabase
        .from('master_recordings')
        .select(`
          *,
          publishing_rights (*),
          split_sheets (
            id,
            status,
            split_sheet_participants (*)
          )
        `)
        .eq('rights_holder_id', rightsHolder.id)
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

  const handleEdit = (recording: MasterRecording) => {
    setEditingRecording(recording);
    setEditFormData({
      title: recording.title,
      artist: recording.artist,
      genre: recording.genre,
      mood: recording.mood,
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
        .from('master_recordings')
        .update({
          title: editFormData.title,
          artist: editFormData.artist,
          genre: editFormData.genre,
          mood: editFormData.mood,
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
          ? { ...rec, ...editFormData, updated_at: new Date().toISOString() }
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
      alert('Failed to update recording');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (recordingId: string) => {
    if (!confirm('Are you sure you want to delete this recording? This action cannot be undone.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('master_recordings')
        .delete()
        .eq('id', recordingId);

      if (deleteError) throw deleteError;

      // Update local state
      setRecordings(prev => prev.filter(rec => rec.id !== recordingId));
      setSelectedRecording(null);
    } catch (err) {
      console.error('Error deleting recording:', err);
      alert('Failed to delete recording');
    }
  };

  const handlePlayAudio = (audioUrl: string, recordingId: string) => {
    if (playingAudio === recordingId) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(recordingId);
      // In a real implementation, you would play the audio here
      // For now, we'll just simulate it
      setTimeout(() => setPlayingAudio(null), 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-400/20';
      case 'verified':
        return 'text-blue-400 bg-blue-400/20';
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
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'verified':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const filteredRecordings = recordings.filter(recording => {
    const matchesSearch = recording.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recording.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recording.genre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || recording.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading recordings...</p>
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
            <Music className="w-8 h-8 text-blue-400 mr-2" />
            <h1 className="text-3xl font-bold text-white">Master Recordings</h1>
          </div>
          <p className="text-gray-300">
            Manage your uploaded tracks, edit metadata, and track licensing status
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search recordings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={fetchRecordings}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
            <button
              onClick={() => window.location.href = '/rights-holder/upload'}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload New Recording
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Recordings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRecordings.map((recording) => (
            <div
              key={recording.id}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-blue-500/50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {editingRecording?.id === recording.id ? (
                      <input
                        type="text"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-gray-800/50 border border-gray-600 rounded px-2 py-1 text-white"
                      />
                    ) : (
                      recording.title
                    )}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {editingRecording?.id === recording.id ? (
                      <input
                        type="text"
                        value={editFormData.artist}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, artist: e.target.value }))}
                        className="w-full bg-gray-800/50 border border-gray-600 rounded px-2 py-1 text-white"
                      />
                    ) : (
                      recording.artist
                    )}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(recording.status)}`}>
                  {getStatusIcon(recording.status)}
                  <span className="ml-1">{recording.status}</span>
                </div>
              </div>

              {/* Artwork and Audio Controls */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                  {recording.artwork_url ? (
                    <img 
                      src={recording.artwork_url} 
                      alt={recording.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Music className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <button
                    onClick={() => handlePlayAudio(recording.audio_url, recording.id)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    {playingAudio === recording.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {playingAudio === recording.id ? 'Playing...' : 'Play'}
                  </button>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDuration(recording.duration)}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Genre:</span>
                  <span className="text-white">
                    {editingRecording?.id === recording.id ? (
                      <input
                        type="text"
                        value={editFormData.genre}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, genre: e.target.value }))}
                        className="bg-gray-800/50 border border-gray-600 rounded px-2 py-1 text-white text-right"
                      />
                    ) : (
                      recording.genre
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">BPM:</span>
                  <span className="text-white">
                    {editingRecording?.id === recording.id ? (
                      <input
                        type="number"
                        value={editFormData.bpm}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, bpm: parseInt(e.target.value) || 0 }))}
                        className="bg-gray-800/50 border border-gray-600 rounded px-2 py-1 text-white text-right w-16"
                      />
                    ) : (
                      recording.bpm
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Key:</span>
                  <span className="text-white">
                    {editingRecording?.id === recording.id ? (
                      <input
                        type="text"
                        value={editFormData.key}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, key: e.target.value }))}
                        className="bg-gray-800/50 border border-gray-600 rounded px-2 py-1 text-white text-right"
                      />
                    ) : (
                      recording.key
                    )}
                  </span>
                </div>
              </div>

              {/* Split Sheet Status */}
              {recording.split_sheet && (
                <div className="mb-4 p-3 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Split Sheet</span>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(recording.split_sheet.status)}`}>
                      {recording.split_sheet.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {editingRecording?.id === recording.id ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center text-sm"
                    >
                      {saving ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      Save
                    </button>
                    <button
                      onClick={() => setEditingRecording(null)}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(recording)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center text-sm"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => setSelectedRecording(recording)}
                      className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center text-sm"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(recording.id)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Date */}
              <div className="text-xs text-gray-400 mt-3 text-center">
                Uploaded: {new Date(recording.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredRecordings.length === 0 && !loading && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Recordings Found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Upload your first recording to get started'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => window.location.href = '/rights-holder/upload'}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center mx-auto"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Recording
              </button>
            )}
          </div>
        )}

        {/* Recording Detail Modal */}
        {selectedRecording && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Recording Details</h2>
                <button
                  onClick={() => setSelectedRecording(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Recording Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400">Title</label>
                      <p className="text-white">{selectedRecording.title}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Artist</label>
                      <p className="text-white">{selectedRecording.artist}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Genre</label>
                      <p className="text-white">{selectedRecording.genre}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Mood</label>
                      <p className="text-white">{selectedRecording.mood}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">BPM</label>
                      <p className="text-white">{selectedRecording.bpm}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Key</label>
                      <p className="text-white">{selectedRecording.key}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Duration</label>
                      <p className="text-white">{formatDuration(selectedRecording.duration)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Rights Information</h3>
                  <div className="space-y-3">
                    {selectedRecording.publishing_rights && (
                      <div>
                        <label className="text-sm text-gray-400">Publishing Owner</label>
                        <p className="text-white">{selectedRecording.publishing_rights.publishing_owner}</p>
                      </div>
                    )}
                    {selectedRecording.publishing_rights && (
                      <div>
                        <label className="text-sm text-gray-400">Publishing Percentage</label>
                        <p className="text-white">{selectedRecording.publishing_rights.publishing_percentage}%</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm text-gray-400">Status</label>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRecording.status)}`}>
                        {getStatusIcon(selectedRecording.status)}
                        <span className="ml-1">{selectedRecording.status}</span>
                      </div>
                    </div>
                    {selectedRecording.verification_notes && (
                      <div>
                        <label className="text-sm text-gray-400">Verification Notes</label>
                        <p className="text-white">{selectedRecording.verification_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedRecording.description && (
                <div className="bg-gray-800/30 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                  <p className="text-gray-300">{selectedRecording.description}</p>
                </div>
              )}

              {/* Split Sheet Information */}
              {selectedRecording.split_sheet && (
                <div className="bg-gray-800/30 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Split Sheet</h3>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-300">Status</span>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRecording.split_sheet.status)}`}>
                      {getStatusIcon(selectedRecording.split_sheet.status)}
                      <span className="ml-1">{selectedRecording.split_sheet.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  {selectedRecording.split_sheet.participants && selectedRecording.split_sheet.participants.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Participants</h4>
                      <div className="space-y-2">
                        {selectedRecording.split_sheet.participants.map((participant: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-300">{participant.name} ({participant.role})</span>
                            <span className="text-white">{participant.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => handleEdit(selectedRecording)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Recording
                </button>
                <button
                  onClick={() => window.open(selectedRecording.audio_url, '_blank')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Audio
                </button>
                <button
                  onClick={() => setSelectedRecording(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
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
