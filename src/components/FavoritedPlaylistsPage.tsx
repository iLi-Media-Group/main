import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Music, Clock, User, Search, Filter, X } from 'lucide-react';
import { PlaylistService } from '../lib/playlistService';

interface FavoritedPlaylist {
  playlist_id: string;
  playlist_name: string;
  playlist_description: string;
  producer_name: string;
  tracks_count: number;
  favorited_at: string;
}

export function FavoritedPlaylistsPage() {
  const [playlists, setPlaylists] = useState<FavoritedPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPlaylists, setFilteredPlaylists] = useState<FavoritedPlaylist[]>([]);

  useEffect(() => {
    loadFavoritedPlaylists();
  }, []);

  useEffect(() => {
    // Filter playlists based on search term
    const filtered = playlists.filter(playlist =>
      playlist.playlist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      playlist.producer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      playlist.playlist_description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPlaylists(filtered);
  }, [playlists, searchTerm]);

  const loadFavoritedPlaylists = async () => {
    try {
      setLoading(true);
      const favoritedPlaylists = await PlaylistService.getFavoritedPlaylists(100);
      setPlaylists(favoritedPlaylists);
    } catch (err) {
      console.error('Failed to load favorited playlists:', err);
      setError('Failed to load favorited playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (playlistId: string) => {
    try {
      await PlaylistService.toggleFavorite(playlistId);
      setPlaylists(playlists.filter(p => p.playlist_id !== playlistId));
    } catch (err) {
      console.error('Failed to remove from favorites:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-3 mb-8">
            <Heart className="w-8 h-8 text-red-400" />
            <h1 className="text-3xl font-bold text-white">Favorited Playlists</h1>
          </div>
          <div className="animate-pulse space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-6">
                <div className="h-6 bg-white/10 rounded mb-3"></div>
                <div className="h-4 bg-white/10 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-white/10 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Heart className="w-8 h-8 text-red-400" />
            <h1 className="text-3xl font-bold text-white">Favorited Playlists</h1>
            <span className="text-gray-400 text-lg">({playlists.length})</span>
          </div>
          <Link
            to="/dashboard"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search playlists, producers, or descriptions..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Playlists Grid */}
        {filteredPlaylists.length === 0 ? (
          <div className="text-center py-12">
            {searchTerm ? (
              <>
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No playlists found</h2>
                <p className="text-gray-400 mb-4">
                  No playlists match your search for "{searchTerm}"
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No favorited playlists</h2>
                <p className="text-gray-400 mb-4">
                  You haven't favorited any playlists yet
                </p>
                <Link
                  to="/catalog"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Browse Playlists
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaylists.map((playlist) => (
              <div
                key={playlist.playlist_id}
                className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/view-playlist/${playlist.producer_name.toLowerCase().replace(/\s+/g, '-')}/${playlist.playlist_name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="block"
                    >
                      <h3 className="text-lg font-semibold text-white hover:text-blue-300 transition-colors truncate">
                        {playlist.playlist_name}
                      </h3>
                    </Link>
                    <div className="flex items-center space-x-2 mt-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-400 truncate">
                        {playlist.producer_name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFavorite(playlist.playlist_id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-2"
                    title="Remove from favorites"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {playlist.playlist_description && (
                  <p className="text-sm text-gray-300 mb-4 line-clamp-3">
                    {playlist.playlist_description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Music className="w-4 h-4" />
                      <span>{playlist.tracks_count} tracks</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(playlist.favorited_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Heart className="w-5 h-5 text-red-400" />
                </div>

                <div className="mt-4">
                  <Link
                    to={`/view-playlist/${playlist.producer_name.toLowerCase().replace(/\s+/g, '-')}/${playlist.playlist_name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    View Playlist
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
