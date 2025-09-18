import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { X, Music, Plus, Trash2, Play, Clock, User, Search } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  genre: string;
  mood: string;
  bpm: number;
  duration: number;
  track_url: string;
  producer_name: string;
  artist_name: string;
}

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: string;
  opportunityTitle: string;
  clientName: string;
  submissionEmail: string;
  onPlaylistCreated: () => void;
}

export function CreatePlaylistModal({
  isOpen,
  onClose,
  opportunityId,
  opportunityTitle,
  clientName,
  submissionEmail,
  onPlaylistCreated
}: CreatePlaylistModalProps) {
  const { user } = useUnifiedAuth();
  const [playlistName, setPlaylistName] = useState('');
  const [submissionInstructions, setSubmissionInstructions] = useState('');
  const [availableTracks, setAvailableTracks] = useState<Track[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterMood, setFilterMood] = useState('');

  // Fetch available tracks for the opportunity
  useEffect(() => {
    if (isOpen && opportunityId) {
      fetchAvailableTracks();
    }
  }, [isOpen, opportunityId]);

  const fetchAvailableTracks = async () => {
    try {
      setLoading(true);

      // Get opportunity requirements
      const { data: opportunity, error: oppError } = await supabase
        .from('pitch_opportunities')
        .select('genre_requirements, mood_requirements, bpm_range_min, bpm_range_max')
        .eq('id', opportunityId)
        .single();

      if (oppError) {
        console.error('Error fetching opportunity:', oppError);
        return;
      }

      // Build query for tracks
      let query = supabase
        .from('tracks')
        .select(`
          id,
          title,
          genre,
          mood,
          bpm,
          duration,
          track_url,
          track_producer_id,
          roster_entity_id,
          profiles!tracks_track_producer_id_fkey (
            display_name
          )
        `)
        .eq('is_active', true);

      // Apply genre filter if specified
      if (opportunity.genre_requirements && opportunity.genre_requirements.length > 0) {
        query = query.overlaps('genre', opportunity.genre_requirements);
      }

      // Apply mood filter if specified
      if (opportunity.mood_requirements && opportunity.mood_requirements.length > 0) {
        query = query.overlaps('mood', opportunity.mood_requirements);
      }

      // Apply BPM range if specified
      if (opportunity.bpm_range_min) {
        query = query.gte('bpm', opportunity.bpm_range_min);
      }
      if (opportunity.bpm_range_max) {
        query = query.lte('bpm', opportunity.bpm_range_max);
      }

      const { data: tracksData, error: tracksError } = await query;

      if (tracksError) {
        console.error('Error fetching tracks:', tracksError);
        return;
      }

      // Transform tracks data
      const transformedTracks = (tracksData || []).map(track => ({
        id: track.id,
        title: track.title,
        genre: track.genre,
        mood: track.mood,
        bpm: track.bpm,
        duration: track.duration,
        track_url: track.track_url,
        producer_name: track.profiles?.display_name || 'Unknown',
        artist_name: track.profiles?.display_name || 'Unknown'
      }));

      setAvailableTracks(transformedTracks);
    } catch (error) {
      console.error('Error fetching available tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim() || selectedTracks.length === 0) {
      alert('Please provide a playlist name and select at least one track.');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('pitch_playlists')
        .insert({
          opportunity_id: opportunityId,
          playlist_name: playlistName,
          submission_email: submissionEmail,
          submission_instructions: submissionInstructions,
          tracks_included: selectedTracks,
          submission_status: 'draft',
          created_by: user?.id
        });

      if (error) {
        console.error('Error creating playlist:', error);
        alert('Error creating playlist. Please try again.');
        return;
      }

      onPlaylistCreated();
      onClose();
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Error creating playlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTrackSelection = (trackId: string) => {
    setSelectedTracks(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  const filteredTracks = availableTracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         track.producer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = !filterGenre || track.genre.includes(filterGenre);
    const matchesMood = !filterMood || track.mood.includes(filterMood);
    
    return matchesSearch && matchesGenre && matchesMood;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Playlist</h2>
            <p className="text-gray-600 mt-1">
              {opportunityTitle} • {clientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Playlist Details */}
          <div className="w-1/3 p-6 border-r border-gray-200 flex flex-col">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Playlist Name
                </label>
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="Enter playlist name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Submission Instructions
                </label>
                <textarea
                  value={submissionInstructions}
                  onChange={(e) => setSubmissionInstructions(e.target.value)}
                  placeholder="Instructions for the client..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Submission Email
                </label>
                <input
                  type="email"
                  value={submissionEmail}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
            </div>

            {/* Selected Tracks Summary */}
            <div className="mt-6 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Selected Tracks ({selectedTracks.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedTracks.map(trackId => {
                  const track = availableTracks.find(t => t.id === trackId);
                  if (!track) return null;
                  
                  return (
                    <div key={trackId} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {track.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {track.producer_name} • {formatDuration(track.duration)}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleTrackSelection(trackId)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-3">
              <button
                onClick={handleCreatePlaylist}
                disabled={loading || !playlistName.trim() || selectedTracks.length === 0}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Playlist'}
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Right Panel - Track Selection */}
          <div className="w-2/3 p-6 flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Available Tracks ({filteredTracks.length})
              </h3>
              
              {/* Filters */}
              <div className="flex space-x-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search tracks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={filterGenre}
                  onChange={(e) => setFilterGenre(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Genres</option>
                  {Array.from(new Set(availableTracks.flatMap(t => t.genre))).map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
                <select
                  value={filterMood}
                  onChange={(e) => setFilterMood(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Moods</option>
                  {Array.from(new Set(availableTracks.flatMap(t => t.mood))).map(mood => (
                    <option key={mood} value={mood}>{mood}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Track List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTracks.map(track => (
                    <div
                      key={track.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTracks.includes(track.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleTrackSelection(track.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            selectedTracks.includes(track.id)
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedTracks.includes(track.id) && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {track.title}
                            </h4>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                              <span className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {track.producer_name}
                              </span>
                              <span>{track.genre}</span>
                              <span>{track.mood}</span>
                              <span>{track.bpm} BPM</span>
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDuration(track.duration)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {track.track_url && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(track.track_url, '_blank');
                              }}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                        </div>
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
