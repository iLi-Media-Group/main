import React, { useState, useEffect } from 'react';
import { Plus, Music, X, Check } from 'lucide-react';
import { PlaylistService } from '../lib/playlistService';
import { Playlist } from '../types/playlist';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  trackTitle: string;
  accountType?: string;
}

export function AddToPlaylistModal({ 
  isOpen, 
  onClose, 
  trackId, 
  trackTitle, 
  accountType = 'client' 
}: AddToPlaylistModalProps) {
  const { user } = useUnifiedAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistData, setNewPlaylistData] = useState({
    name: '',
    description: '',
    company_name: '',
    is_public: true
  });

  useEffect(() => {
    if (isOpen && user) {
      loadUserPlaylists();
    }
  }, [isOpen, user, accountType]);

  const loadUserPlaylists = async () => {
    try {
      setLoading(true);
      setError('');
      
      let playlistsData;
      switch (accountType) {
        case 'client':
          playlistsData = await PlaylistService.getClientPlaylists();
          break;
        case 'artist_band':
          playlistsData = await PlaylistService.getArtistPlaylists();
          break;
        case 'rights_holder':
          playlistsData = await PlaylistService.getRecordLabelPlaylists();
          break;
        case 'producer':
        default:
          playlistsData = await PlaylistService.getProducerPlaylists();
          break;
      }
      
      setPlaylists(playlistsData);
    } catch (err) {
      console.error('Failed to load playlists:', err);
      setError('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToExistingPlaylist = async (playlistId: string) => {
    try {
      setLoading(true);
      setError('');
      
      await PlaylistService.addTrackToPlaylist(playlistId, trackId);
      setSuccess(`Added "${trackTitle}" to playlist`);
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1500);
    } catch (err) {
      console.error('Failed to add track to playlist:', err);
      setError('Failed to add track to playlist');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPlaylistData.name.trim()) {
      setError('Playlist name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Create new playlist
      const newPlaylist = await PlaylistService.createPlaylist(newPlaylistData, accountType);
      
      // Add track to the new playlist
      await PlaylistService.addTrackToPlaylist(newPlaylist.id, trackId);
      
      setSuccess(`Created playlist "${newPlaylist.name}" and added "${trackTitle}"`);
      
      // Reset form and close modal
      setNewPlaylistData({
        name: '',
        description: '',
        company_name: '',
        is_public: true
      });
      setShowCreateForm(false);
      
      // Reload playlists
      await loadUserPlaylists();
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1500);
    } catch (err) {
      console.error('Failed to create playlist:', err);
      setError('Failed to create playlist');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-blue-900/90 rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-blue-500/40 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Add to Playlist</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-300 text-sm">
            Adding: <span className="text-white font-medium">"{trackTitle}"</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        {!showCreateForm ? (
          <>
            {/* Existing Playlists */}
            <div className="mb-4">
              <h4 className="text-white font-medium mb-3">Add to existing playlist:</h4>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : playlists.length === 0 ? (
                <p className="text-gray-400 text-sm">No playlists found</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => handleAddToExistingPlaylist(playlist.id)}
                      disabled={loading}
                      className="w-full p-3 bg-white/5 hover:bg-white/10 border border-gray-600 rounded-lg text-left transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{playlist.name}</p>
                          {playlist.description && (
                            <p className="text-gray-400 text-sm">{playlist.description}</p>
                          )}
                          <p className="text-gray-500 text-xs">
                            {playlist.tracks_count || 0} tracks
                          </p>
                        </div>
                        <Music className="w-4 h-4 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Create New Playlist Button */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full p-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Playlist
            </button>
          </>
        ) : (
          /* Create New Playlist Form */
          <form onSubmit={handleCreateNewPlaylist} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Playlist Name *
              </label>
              <input
                type="text"
                value={newPlaylistData.name}
                onChange={(e) => setNewPlaylistData({ ...newPlaylistData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter playlist name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newPlaylistData.description}
                onChange={(e) => setNewPlaylistData({ ...newPlaylistData, description: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Describe your playlist"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={newPlaylistData.company_name}
                onChange={(e) => setNewPlaylistData({ ...newPlaylistData, company_name: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Your company name"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-public"
                checked={newPlaylistData.is_public}
                onChange={(e) => setNewPlaylistData({ ...newPlaylistData, is_public: e.target.checked })}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is-public" className="text-sm text-gray-300">
                Make playlist public
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create & Add Track'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
