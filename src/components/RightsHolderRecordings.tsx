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
  BarChart3,
  ChevronDown,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { MOODS_CATEGORIES, MOODS, MEDIA_USAGE_CATEGORIES, MEDIA_USAGE_TYPES } from '../types';
import { fetchInstrumentsData, type InstrumentWithCategory } from '../lib/instruments';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { useCurrentPlan } from '../hooks/useCurrentPlan';
import { PremiumFeatureNotice } from './PremiumFeatureNotice';
import { uploadFile } from '../lib/storage';
import { useDynamicSearchData } from '../hooks/useDynamicSearchData';

interface Track {
  id: string;
  title: string;
  artist: string;
  genres: string[];
  sub_genres: string[];
  moods: string[];
  instruments?: string[];
  media_usage?: string[];
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
  stems_url?: string;
  split_sheet_url?: string;
  mp3_url?: string;
  trackouts_url?: string;
  deleted_at?: string;
}

interface EditFormData {
  title: string;
  artist: string;
  bpm: number;
  key: string;
  description: string;
}

export function RightsHolderRecordings() {
  const { user } = useUnifiedAuth();
  const [recordings, setRecordings] = useState<Track[]>([]);
  const [deletedRecordings, setDeletedRecordings] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [selectedRecording, setSelectedRecording] = useState<Track | null>(null);
  const [editingRecording, setEditingRecording] = useState<Track | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    title: '',
    artist: '',
    bpm: 0,
    key: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  // Robust edit state
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [selectedMediaUsage, setSelectedMediaUsage] = useState<string[]>([]);
  const [hasVocals, setHasVocals] = useState(false);
  const [isSyncOnly, setIsSyncOnly] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Data fetching state
  const [instruments, setInstruments] = useState<InstrumentWithCategory[]>([]);
  const [instrumentsLoading, setInstrumentsLoading] = useState(true);
  const [genres, setGenres] = useState<any[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);

  // File upload state
  const [stemsUrl, setStemsUrl] = useState('');
  const [splitSheetFile, setSplitSheetFile] = useState<File | null>(null);
  const [splitSheetUrl, setSplitSheetUrl] = useState('');
  const [mp3File, setMp3File] = useState<File | null>(null);
  const [mp3Url, setMp3Url] = useState('');
  const [trackoutsFile, setTrackoutsFile] = useState<File | null>(null);
  const [trackoutsUrl, setTrackoutsUrl] = useState('');
  const [stemsFile, setStemsFile] = useState<File | null>(null);

  // Hooks
  const deepMediaSearchEnabled = useFeatureFlag('deep_media_search');
  const { currentPlan } = useCurrentPlan();
  const { mediaTypes } = useDynamicSearchData();

  // Fetch recordings on component mount
  useEffect(() => {
    if (user) {
      fetchRecordings();
      fetchEditData();
    }
  }, [user]);

  // Fetch data for edit functionality
  const fetchEditData = async () => {
    try {
      setGenresLoading(true);
      setInstrumentsLoading(true);
      
      // Fetch genres
      const { data: genresData, error: genresError } = await supabase
        .from('genres')
        .select(`
          *,
          sub_genres (*)
        `)
        .order('display_name');

      if (genresError) throw genresError;
      setGenres(genresData || []);
      
      // Fetch instruments
      const instrumentsData = await fetchInstrumentsData();
      setInstruments(instrumentsData.instruments);
    } catch (err) {
      console.error('Error fetching edit data:', err);
      setGenres([]);
      setInstruments([]);
    } finally {
      setGenresLoading(false);
      setInstrumentsLoading(false);
    }
  };

  const fetchRecordings = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch active recordings
      const { data: activeRecordingsData, error: activeError } = await supabase
        .from('tracks')
        .select('*')
        .eq('track_producer_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;

      // Fetch deleted recordings
      const { data: deletedRecordingsData, error: deletedError } = await supabase
        .from('tracks')
        .select('*')
        .eq('track_producer_id', user.id)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (deletedError) throw deletedError;

      setRecordings(activeRecordingsData || []);
      setDeletedRecordings(deletedRecordingsData || []);
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
      bpm: recording.bpm,
      key: recording.key,
      description: recording.description
    });
    
    // Set robust edit state
    setSelectedGenres(Array.isArray(recording.genres) ? recording.genres : []);
    setSelectedMoods(Array.isArray(recording.moods) ? recording.moods : []);
    setSelectedInstruments(Array.isArray(recording.instruments) ? recording.instruments : []);
    setSelectedMediaUsage(Array.isArray(recording.media_usage) ? recording.media_usage : []);
    setHasVocals(recording.has_vocals || false);
    setIsSyncOnly(recording.is_sync_only || false);
    setStemsUrl(recording.stems_url || '');
    setSplitSheetUrl(recording.split_sheet_url || '');
    setMp3Url(recording.mp3_url || '');
    setTrackoutsUrl(recording.trackouts_url || '');
  };

  const handleSave = async () => {
    if (!editingRecording) return;

    setSaving(true);
    try {
      if (selectedGenres.length === 0) {
        throw new Error('At least one genre is required');
      }

      const formattedGenres = selectedGenres;
      const validMoods = selectedMoods.filter(mood => MOODS.includes(mood));

      // Check if any files are being uploaded
      const hasFilesToUpload = mp3File || trackoutsFile || stemsFile || splitSheetFile;
      
      if (hasFilesToUpload) {
        setUploadingFiles(true);
      }

      // File upload logic
      let mp3UploadedUrl = mp3Url;
      if (mp3File) {
        try {
          const uploadedMp3Path = await uploadFile(
            mp3File,
            'track-audio',
            undefined,
            `${editingRecording.id}`,
            'audio.mp3'
          );
          mp3UploadedUrl = `${editingRecording.id}/audio.mp3`;
        } catch (uploadError) {
          throw new Error(`Failed to upload MP3 file: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }

      let trackoutsUploadedUrl = trackoutsUrl;
      if (trackoutsFile) {
        try {
          const uploadedTrackoutsPath = await uploadFile(
            trackoutsFile,
            'trackouts',
            undefined,
            `${editingRecording.id}`,
            'trackouts.zip'
          );
          trackoutsUploadedUrl = `${editingRecording.id}/trackouts.zip`;
        } catch (uploadError) {
          throw new Error(`Failed to upload trackouts file: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }

      let stemsUploadedUrl = stemsUrl;
      if (stemsFile) {
        try {
          const uploadedStemsPath = await uploadFile(
            stemsFile,
            'stems',
            undefined,
            `${editingRecording.id}`,
            'stems.zip'
          );
          stemsUploadedUrl = `${editingRecording.id}/stems.zip`;
        } catch (uploadError) {
          throw new Error(`Failed to upload stems file: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }

      let splitSheetUploadedUrl = splitSheetUrl;
      if (splitSheetFile) {
        try {
          const uploadedSplitSheetPath = await uploadFile(
            splitSheetFile,
            'split-sheets',
            undefined,
            `${editingRecording.id}`,
            'split_sheet.pdf'
          );
          splitSheetUploadedUrl = `${editingRecording.id}/split_sheet.pdf`;
        } catch (uploadError) {
          throw new Error(`Failed to upload split sheet file: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }

      const { error: updateError } = await supabase
        .from('tracks')
        .update({
          title: editFormData.title,
          artist: editFormData.artist,
          genres: formattedGenres.map(genreId => {
            const genre = genres.find(g => g.id === genreId || g.display_name === genreId);
            return genre?.display_name || genreId;
          }),
          moods: validMoods,
          instruments: selectedInstruments,
          media_usage: selectedMediaUsage,
          has_vocals: hasVocals,
          is_sync_only: isSyncOnly,
          bpm: editFormData.bpm,
          key: editFormData.key,
          description: editFormData.description,
          mp3_url: mp3UploadedUrl || null,
          trackouts_url: trackoutsUploadedUrl || null,
          stems_url: stemsUploadedUrl || null,
          split_sheet_url: splitSheetUploadedUrl || null,
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
              genres: formattedGenres,
              moods: validMoods,
              instruments: selectedInstruments,
              media_usage: selectedMediaUsage,
              has_vocals: hasVocals,
              is_sync_only: isSyncOnly,
              bpm: editFormData.bpm,
              key: editFormData.key,
              description: editFormData.description,
              mp3_url: mp3UploadedUrl || null,
              trackouts_url: trackoutsUploadedUrl || null,
              stems_url: stemsUploadedUrl || null,
              split_sheet_url: splitSheetUploadedUrl || null,
              updated_at: new Date().toISOString() 
            }
          : rec
      ));

      setEditingRecording(null);
      setEditFormData({
        title: '',
        artist: '',
        bpm: 0,
        key: '',
        description: ''
      });
      
      // Reset robust edit state
      setSelectedGenres([]);
      setSelectedMoods([]);
      setSelectedInstruments([]);
      setSelectedMediaUsage([]);
      setHasVocals(false);
      setIsSyncOnly(false);
      setStemsUrl('');
      setSplitSheetUrl('');
      setMp3Url('');
      setTrackoutsUrl('');
      setMp3File(null);
      setTrackoutsFile(null);
      setStemsFile(null);
      setSplitSheetFile(null);
    } catch (err) {
      console.error('Error updating recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to update recording');
    } finally {
      setSaving(false);
      setUploadingFiles(false);
    }
  };

  const handleDelete = async (recordingId: string) => {
    if (!confirm('Are you sure you want to delete this recording? It will be moved to the deleted tab where you can restore it or delete it permanently.')) return;

    try {
      const { error: deleteError } = await supabase
        .from('tracks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', recordingId);

      if (deleteError) throw deleteError;

      // Move to deleted recordings
      const deletedRecording = recordings.find(rec => rec.id === recordingId);
      if (deletedRecording) {
        setRecordings(prev => prev.filter(rec => rec.id !== recordingId));
        setDeletedRecordings(prev => [deletedRecording, ...prev]);
      }
    } catch (err) {
      console.error('Error deleting recording:', err);
      setError('Failed to delete recording');
    }
  };

  const handleRestore = async (recordingId: string) => {
    try {
      const { error: restoreError } = await supabase
        .from('tracks')
        .update({ deleted_at: null })
        .eq('id', recordingId);

      if (restoreError) throw restoreError;

      // Move back to active recordings
      const restoredRecording = deletedRecordings.find(rec => rec.id === recordingId);
      if (restoredRecording) {
        setDeletedRecordings(prev => prev.filter(rec => rec.id !== recordingId));
        setRecordings(prev => [restoredRecording, ...prev]);
      }
    } catch (err) {
      console.error('Error restoring recording:', err);
      setError('Failed to restore recording');
    }
  };

  const handlePermanentDelete = async (recordingId: string) => {
    if (!confirm('Are you sure you want to permanently delete this recording? This action cannot be undone.')) return;

    try {
      const { error: deleteError } = await supabase
        .from('tracks')
        .delete()
        .eq('id', recordingId);

      if (deleteError) throw deleteError;

      setDeletedRecordings(prev => prev.filter(rec => rec.id !== recordingId));
    } catch (err) {
      console.error('Error permanently deleting recording:', err);
      setError('Failed to permanently delete recording');
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
                    <p><strong>Genres:</strong> {Array.isArray(recording.genres) ? recording.genres.join(', ') : 'None'}</p>
                                          <p><strong>Moods:</strong> {Array.isArray(recording.moods) ? recording.moods.join(', ') : 'None'}</p>
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
