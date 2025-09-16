import React, { useState, useEffect } from 'react';
import { X, Send, Loader2, Music, Play, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';

interface SubmitToBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: {
    id: string;
    title: string;
    submission_email: string;
    client_name: string;
    assigned_agent: string | null;
  };
  onSubmissionSent: () => void;
}

interface Track {
  id: string;
  title: string;
  genre: string;
  mood: string;
  duration: number;
  audio_url: string;
  producer_name: string;
}

interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
}

export function SubmitToBriefModal({ isOpen, onClose, opportunity, onSubmissionSent }: SubmitToBriefModalProps) {
  const { user } = useUnifiedAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [submissionType, setSubmissionType] = useState<'playlist' | 'track'>('playlist');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [message, setMessage] = useState('');
  const [playlistSearch, setPlaylistSearch] = useState<string>('');
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState<boolean>(false);
  const [trackSearch, setTrackSearch] = useState<string>('');
  const [showTrackDropdown, setShowTrackDropdown] = useState<boolean>(false);
  
  // Data
  const [availablePlaylists, setAvailablePlaylists] = useState<Playlist[]>([]);
  const [availableTracks, setAvailableTracks] = useState<Track[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Filter playlists based on search
  const filteredPlaylists = availablePlaylists.filter(playlist =>
    playlist.name.toLowerCase().includes(playlistSearch.toLowerCase())
  );

  // Filter tracks based on search
  const filteredTracks = availableTracks.filter(track =>
    track.title.toLowerCase().includes(trackSearch.toLowerCase()) ||
    track.genre.toLowerCase().includes(trackSearch.toLowerCase()) ||
    track.mood.toLowerCase().includes(trackSearch.toLowerCase()) ||
    track.producer_name.toLowerCase().includes(trackSearch.toLowerCase())
  );

  // Get selected playlist name for display
  const selectedPlaylistName = availablePlaylists.find(p => p.id === selectedPlaylist)?.name || '';
  
  // Get selected track name for display
  const selectedTrackName = availableTracks.find(t => t.id === selectedTrack)?.title || '';

  useEffect(() => {
    if (isOpen && user) {
      checkAuthorization();
      fetchSubmissionData();
      // Reset form
      setSubmissionType('playlist');
      setSelectedPlaylist('');
      setSelectedTrack('');
      setMessage('');
      setPlaylistSearch('');
      setShowPlaylistDropdown(false);
      setTrackSearch('');
      setShowTrackDropdown(false);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, user, opportunity]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (showPlaylistDropdown && !target.closest('.playlist-dropdown-container')) {
        setShowPlaylistDropdown(false);
      }
      
      if (showTrackDropdown && !target.closest('.track-dropdown-container')) {
        setShowTrackDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPlaylistDropdown, showTrackDropdown]);

  const checkAuthorization = async () => {
    if (!user) return;
    
    try {
      // Check if user is admin or the assigned agent
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', user.id)
        .single();

      const isAdmin = profile?.account_type === 'admin' || profile?.account_type === 'admin,producer';
      const isAssignedAgent = opportunity.assigned_agent === user.id;
      
      setIsAuthorized(isAdmin || isAssignedAgent);
    } catch (err) {
      console.error('Error checking authorization:', err);
      setIsAuthorized(false);
    }
  };

  const fetchSubmissionData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch available playlists (from main playlists table, not pitch-specific)
      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select('id, name, description')
        .eq('producer_id', user.id);

      if (playlistsError) {
        console.error('Error fetching playlists:', playlistsError);
        throw playlistsError;
      }

      // Transform playlists data
      const transformedPlaylists = (playlistsData || []).map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        tracks: [] // Will be populated later if needed
      }));

      setAvailablePlaylists(transformedPlaylists);
      console.log('Loaded playlists:', transformedPlaylists.length);

      // Fetch available tracks (from current user and other pitch-enabled producers)
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('id, title, genre, mood, duration, audio_url, track_producer_id')
        .is('deleted_at', null)  // Only get non-deleted tracks
        .order('created_at', { ascending: false })
        .limit(100);

      if (tracksError) throw tracksError;

      // Transform tracks data and filter for pitch-enabled producers
      const transformedTracks = (tracksData || [])
        .filter((track: any) => {
          // Include tracks from current user (admin,producer) or other pitch-enabled producers
          // For now, we'll include all tracks and let the user filter via search
          return true;
        })
        .map((track: any) => ({
          id: track.id,
          title: track.title,
          genre: track.genre,
          mood: track.mood,
          duration: track.duration,
          audio_url: track.audio_url,
          producer_name: track.track_producer_id === user.id ? 'You' : 'Unknown Producer'
        }));

      setAvailableTracks(transformedTracks);
      console.log('Loaded tracks:', transformedTracks.length);

    } catch (err) {
      console.error('Error fetching submission data:', err);
      setError('Failed to load submission data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAuthorized) return;

    try {
      setSaving(true);
      setError(null);

      // Validate form
      if (submissionType === 'playlist' && !selectedPlaylist) {
        setError('Please select a playlist');
        return;
      }
      if (submissionType === 'track' && !selectedTrack) {
        setError('Please select a track');
        return;
      }
      if (!message.trim()) {
        setError('Please enter a message');
        return;
      }

      // Prepare submission data
      const submissionData = {
        opportunity_id: opportunity.id,
        submission_type: submissionType,
        playlist_id: submissionType === 'playlist' ? selectedPlaylist : null,
        track_id: submissionType === 'track' ? selectedTrack : null,
        message: message.trim(),
        submitted_by: user.id,
        submission_email: opportunity.submission_email,
        brief_title: opportunity.title
      };

      // Call the email sending function
      const { data, error } = await supabase.functions.invoke('send-brief-submission', {
        body: submissionData
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        onSubmissionSent();
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Error submitting to brief:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit to brief');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-red-900/90 backdrop-blur-md rounded-xl border border-red-500/20 w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Access Denied</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-red-200">
            You are not authorized to submit to this brief. Only the assigned agent or admin can submit.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-blue-900/90 backdrop-blur-md rounded-xl border border-purple-500/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Submit to Brief</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900/50 border border-green-500 rounded-lg p-4 text-green-200">
              Submission sent successfully!
            </div>
          )}

          {/* Brief Information */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Brief Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-300">Title:</span> <span className="text-white">{opportunity.title}</span></p>
              <p><span className="text-gray-300">Client:</span> <span className="text-white">{opportunity.client_name}</span></p>
              <p><span className="text-gray-300">Submission Email:</span> <span className="text-white">{opportunity.submission_email}</span></p>
            </div>
          </div>

          {/* Submission Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Submission Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="playlist"
                  checked={submissionType === 'playlist'}
                  onChange={(e) => setSubmissionType(e.target.value as 'playlist' | 'track')}
                  className="mr-2"
                />
                <span className="text-white">Playlist</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="track"
                  checked={submissionType === 'track'}
                  onChange={(e) => setSubmissionType(e.target.value as 'playlist' | 'track')}
                  className="mr-2"
                />
                <span className="text-white">Individual Track</span>
              </label>
            </div>
          </div>

          {/* Playlist Selection */}
          {submissionType === 'playlist' && (
            <div className="relative playlist-dropdown-container">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Playlist
              </label>
              {loading ? (
                <div className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-400">
                  Loading playlists...
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={playlistSearch}
                    onChange={(e) => {
                      setPlaylistSearch(e.target.value);
                      setShowPlaylistDropdown(true);
                    }}
                    onFocus={() => setShowPlaylistDropdown(true)}
                    placeholder="Search playlists by name..."
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  {showPlaylistDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredPlaylists.length === 0 ? (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                          {playlistSearch ? 'No playlists found matching your search' : 'No playlists available'}
                        </div>
                      ) : (
                        filteredPlaylists.map((playlist) => (
                          <button
                            key={playlist.id}
                            onClick={() => {
                              setSelectedPlaylist(playlist.id);
                              setPlaylistSearch(playlist.name);
                              setShowPlaylistDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left text-gray-900 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                          >
                            <div className="font-medium">{playlist.name}</div>
                            <div className="text-sm text-gray-500">{playlist.tracks.length} tracks</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  
                  {selectedPlaylist && (
                    <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded-lg">
                      <div className="text-sm text-green-800">
                        <strong>Selected:</strong> {selectedPlaylistName}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Track Selection */}
          {submissionType === 'track' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Track
              </label>
              {loading ? (
                <div className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-400">
                  Loading tracks...
                </div>
              ) : (
                <div className="track-dropdown-container relative">
                  <input
                    type="text"
                    value={selectedTrackName || trackSearch}
                    onChange={(e) => {
                      setTrackSearch(e.target.value);
                      setShowTrackDropdown(true);
                      if (!e.target.value) {
                        setSelectedTrack('');
                      }
                    }}
                    onFocus={() => setShowTrackDropdown(true)}
                    placeholder="Search tracks..."
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {showTrackDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredTracks.length === 0 ? (
                        <div className="px-3 py-2 text-gray-400">No tracks found</div>
                      ) : (
                        filteredTracks.map((track) => (
                          <div
                            key={track.id}
                            onClick={() => {
                              setSelectedTrack(track.id);
                              setTrackSearch('');
                              setShowTrackDropdown(false);
                            }}
                            className="px-3 py-2 hover:bg-white/10 cursor-pointer text-white border-b border-white/10 last:border-b-0"
                          >
                            <div className="font-medium">{track.title}</div>
                            <div className="text-sm text-gray-400">
                              {track.producer_name} • {track.genre} • {track.mood}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message to Client <span className="text-red-400">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your message to the client..."
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors flex items-center disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Submission
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
