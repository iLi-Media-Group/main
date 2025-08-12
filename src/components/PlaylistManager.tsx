import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Music, 
  Copy, 
  ExternalLink, 
  Eye, 
  BarChart3,
  Search,
  X,
  Heart
} from 'lucide-react';
import { PlaylistService } from '../lib/playlistService';
import { Playlist, CreatePlaylistData, UpdatePlaylistData } from '../types/playlist';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface PlaylistManagerProps {
  onPlaylistCreated?: (playlist: Playlist) => void;
}

export function PlaylistManager({ onPlaylistCreated }: PlaylistManagerProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [showAddTracksModal, setShowAddTracksModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [producerTracks, setProducerTracks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [formData, setFormData] = useState<CreatePlaylistData>({
    name: '',
    description: '',
    company_name: '',
    logo_url: '',
    photo_url: '',
    is_public: true
  });

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const playlistsData = await PlaylistService.getProducerPlaylistsWithFavorites();
      setPlaylists(playlistsData);
    } catch (err) {
      console.error('Failed to load playlists:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load playlists';
      setError(errorMessage);
      
      // If it's a 406 error, it might be a permissions issue
      if (err instanceof Error && err.message.includes('406')) {
        setError('Permission denied. Please check your authentication status.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadProducerTracks = async () => {
    try {
      const tracks = await PlaylistService.getProducerTracks();
      setProducerTracks(tracks);
    } catch (err) {
      console.error('Failed to load tracks:', err);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPlaylist = await PlaylistService.createPlaylist(formData);
      setPlaylists(prev => [newPlaylist, ...prev]);
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        company_name: '',
        logo_url: '',
        photo_url: '',
        is_public: true
      });
      onPlaylistCreated?.(newPlaylist);
    } catch (err) {
      setError('Failed to create playlist');
      console.error(err);
    }
  };

  const handleUpdatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlaylist) return;

    try {
      const updatedPlaylist = await PlaylistService.updatePlaylist(
        editingPlaylist.id,
        formData
      );
      setPlaylists(prev => 
        prev.map(p => p.id === editingPlaylist.id ? updatedPlaylist : p)
      );
      setShowEditModal(false);
      setEditingPlaylist(null);
      setFormData({
        name: '',
        description: '',
        company_name: '',
        logo_url: '',
        photo_url: '',
        is_public: true
      });
    } catch (err) {
      setError('Failed to update playlist');
      console.error(err);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    const favoriteCount = (playlist as any)?.favorite_count || 0;
    
    let confirmMessage = 'Are you sure you want to delete this playlist?';
    if (favoriteCount > 0) {
      confirmMessage = `This playlist is favorited by ${favoriteCount} client${favoriteCount === 1 ? '' : 's'}. Are you sure you want to delete it? This action cannot be undone.`;
    }
    
    if (!confirm(confirmMessage)) return;

    try {
      await PlaylistService.deletePlaylist(playlistId);
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    } catch (err) {
      setError('Failed to delete playlist');
      console.error(err);
    }
  };

  const handleEditPlaylist = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setFormData({
      name: playlist.name,
      description: playlist.description || '',
      company_name: playlist.company_name || '',
      logo_url: playlist.logo_url || '',
      photo_url: playlist.photo_url || '',
      is_public: playlist.is_public
    });
    setShowEditModal(true);
  };

  const handleAddTracks = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    loadProducerTracks();
    setShowAddTracksModal(true);
  };

  const handleAddTrackToPlaylist = async (trackId: string) => {
    if (!selectedPlaylist) return;

    try {
      console.log('Adding track to playlist:', { playlistId: selectedPlaylist.id, trackId });
      await PlaylistService.addTrackToPlaylist(selectedPlaylist.id, trackId);
      // Refresh the playlists to show updated track count
      await loadPlaylists();
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Failed to add track to playlist:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add track to playlist';
      setError(errorMessage);
      
      // If it's a 406 error, it might be a permissions issue
      if (err instanceof Error && err.message.includes('406')) {
        setError('Permission denied. Please check if you have access to this playlist.');
      }
    }
  };

  const copyPlaylistUrl = (slug: string) => {
    const url = `${window.location.origin}/playlist/${slug}`;
    navigator.clipboard.writeText(url);
    // You could add a toast notification here
  };

  const filteredTracks = producerTracks.filter(track =>
    track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Playlists</h2>
          <p className="text-gray-400">Create and manage playlists to share with music supervisors</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Playlist</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Playlists List */}
      {playlists.length === 0 ? (
        <div className="text-center py-12 bg-blue-800/20 rounded-xl border border-blue-500/20">
          <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No playlists yet</h3>
          <p className="text-gray-400 mb-4">
            Create your first playlist to start sharing your music with music supervisors
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create Your First Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 sm:px-6 lg:px-8">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="bg-blue-800/20 rounded-xl border border-blue-500/20 p-6 hover:bg-blue-800/30 transition-colors">
              <div className="flex flex-col h-full">
                {/* Playlist Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-white truncate">{playlist.name}</h3>
                      {(playlist as any).favorite_count > 0 && (
                        <div 
                          className="flex items-center space-x-1 bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs cursor-help"
                          title={`${(playlist as any).favorite_count} client${(playlist as any).favorite_count === 1 ? '' : 's'} favorited this playlist`}
                        >
                          <Heart className="w-3 h-3" />
                          <span>{(playlist as any).favorite_count}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {playlist.tracks_count || 0} tracks
                    </p>
                    <p className="text-xs text-gray-500">
                      Created {new Date(playlist.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={() => navigate(`/producer/playlists/${playlist.id}/analytics`)}
                      className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/20 rounded"
                      title="View analytics"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => copyPlaylistUrl(playlist.slug)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-blue-500/20 rounded"
                      title="Copy playlist URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Playlist Description */}
                {playlist.description && (
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">{playlist.description}</p>
                )}

                {/* Playlist URL */}
                <div className="bg-blue-900/20 rounded-lg p-3 mb-4">
                  <h4 className="text-xs font-medium text-white mb-1">Playlist URL</h4>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs text-blue-300 bg-blue-900/50 px-2 py-1 rounded flex-1 truncate">
                      {window.location.origin}/playlist/{playlist.slug}
                    </code>
                    <button
                      onClick={() => copyPlaylistUrl(playlist.slug)}
                      className="text-blue-400 hover:text-blue-300 flex-shrink-0"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Playlist Info */}
                <div className="flex items-center space-x-4 text-xs text-gray-400 mb-4">
                  <span className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>{playlist.is_public ? 'Public' : 'Private'}</span>
                  </span>
                  {playlist.company_name && (
                    <span className="truncate">• {playlist.company_name}</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 mt-auto">
                  <a
                    href={`/playlist/${playlist.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 p-2 text-center text-gray-400 hover:text-white hover:bg-blue-500/20 rounded-lg text-sm"
                    title="View playlist"
                  >
                    <ExternalLink className="w-4 h-4 mx-auto mb-1" />
                    View
                  </a>
                  <button
                    onClick={() => handleAddTracks(playlist)}
                    className="flex-1 p-2 text-center text-gray-400 hover:text-white hover:bg-blue-500/20 rounded-lg text-sm"
                    title="Add tracks"
                  >
                    <Plus className="w-4 h-4 mx-auto mb-1" />
                    Add
                  </button>
                  <button
                    onClick={() => handleEditPlaylist(playlist)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-blue-500/20 rounded-lg"
                    title="Edit playlist"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePlaylist(playlist.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg"
                    title="Delete playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-blue-900/90 rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-blue-500/40">
            <h3 className="text-xl font-semibold text-white mb-4">Create New Playlist</h3>
            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Your company name"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is-public" className="text-sm text-gray-300">
                  Make playlist public
                </label>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Create Playlist
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Playlist Modal */}
      {showEditModal && editingPlaylist && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-blue-900/90 rounded-xl p-6 max-w-md w-full mx-4 shadow-lg border border-blue-500/40">
            <h3 className="text-xl font-semibold text-white mb-4">Edit Playlist</h3>
            <form onSubmit={handleUpdatePlaylist} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Your company name"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-public-edit"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is-public-edit" className="text-sm text-gray-300">
                  Make playlist public
                </label>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Update Playlist
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Tracks Modal */}
      {showAddTracksModal && selectedPlaylist && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-blue-900/90 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-lg border border-blue-500/40 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                Add Tracks to "{selectedPlaylist.name}"
              </h3>
              <button
                onClick={() => setShowAddTracksModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Search your tracks..."
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredTracks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No tracks found</p>
                </div>
              ) : (
                filteredTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={track.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop'}
                        alt={track.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <h4 className="text-white font-medium">{track.title}</h4>
                        <p className="text-sm text-gray-400">{track.artist}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddTrackToPlaylist(track.id)}
                      className="btn-primary text-sm px-3 py-1"
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
