import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Music, Clock, User } from 'lucide-react';
import { PlaylistService } from '../lib/playlistService';

interface FavoritedPlaylist {
  playlist_id: string;
  playlist_name: string;
  playlist_description: string;
  producer_name: string;
  tracks_count: number;
  favorited_at: string;
}

export function FavoritedPlaylists() {
  const [playlists, setPlaylists] = useState<FavoritedPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFavoritedPlaylists();
  }, []);

  const loadFavoritedPlaylists = async () => {
    try {
      setLoading(true);
      const favoritedPlaylists = await PlaylistService.getFavoritedPlaylists(5);
      setPlaylists(favoritedPlaylists);
    } catch (err) {
      console.error('Failed to load favorited playlists:', err);
      setError('Failed to load favorited playlists');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Heart className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Favorited Playlists</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-3">
              <div className="h-4 bg-white/10 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Heart className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Favorited Playlists</h3>
        </div>
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Heart className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Favorited Playlists</h3>
        </div>
        <div className="text-center py-6">
          <Heart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No favorited playlists yet</p>
          <p className="text-gray-500 text-xs mt-1">
            Favorite playlists to see them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Heart className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Favorited Playlists</h3>
        </div>
        <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded-full">
          {playlists.length}
        </span>
      </div>
      
      <div className="space-y-3">
        {playlists.map((playlist) => (
          <Link
            key={playlist.playlist_id}
            to={`/playlist/${playlist.producer_name.toLowerCase().replace(/\s+/g, '-')}/${playlist.playlist_name.toLowerCase().replace(/\s+/g, '-')}`}
            className="block bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                  {playlist.playlist_name}
                </h4>
                <div className="flex items-center space-x-2 mt-1">
                  <User className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-400 truncate">
                    {playlist.producer_name}
                  </p>
                </div>
                {playlist.playlist_description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {playlist.playlist_description}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-3">
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <Music className="w-3 h-3" />
                  <span>{playlist.tracks_count}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>
                  Favorited {new Date(playlist.favorited_at).toLocaleDateString()}
                </span>
              </div>
              <Heart className="w-3 h-3 text-red-400" />
            </div>
          </Link>
        ))}
      </div>
      
      {playlists.length >= 5 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <Link
            to="/favorited-playlists"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all favorited playlists →
          </Link>
        </div>
      )}
    </div>
  );
}
