import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Heart, 
  ExternalLink, 
  User, 
  Building,
  Music,
  Clock,
  Star
} from 'lucide-react';
import { PlaylistService } from '../lib/playlistService';
import { PlaylistWithTracks } from '../types/playlist';
import { useAuth } from '../contexts/AuthContext';
import { AudioPlayer } from './AudioPlayer';
import { parseArrayField } from '../lib/utils';
import { LoginModal } from './LoginModal';
import { useSignedUrl } from '../hooks/useSignedUrl';
import { supabase } from '../lib/supabase';

// Component to handle signed URL generation for track audio
function PlaylistTrackAudioPlayer({ track, audioId }: { track: any; audioId: string }) {
  const { signedUrl, loading, error } = useSignedUrl('track-audio', track.mp3_url || track.audio_url);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-16 bg-white/5 rounded-lg">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className="flex items-center justify-center h-16 bg-red-500/10 rounded-lg">
        <p className="text-red-400 text-sm">Audio unavailable</p>
      </div>
    );
  }

  return (
    <AudioPlayer
      src={signedUrl}
      title={track.title}
      audioId={audioId}
      size="sm"
    />
  );
}

export function PlaylistView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [playlist, setPlaylist] = useState<PlaylistWithTracks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (slug) {
      loadPlaylist();
    }
  }, [slug]);

  const loadPlaylist = async () => {
    try {
      setLoading(true);
      if (!slug) return;

      const playlistData = await PlaylistService.getPlaylist(slug);
      if (!playlistData) {
        setError('Playlist not found');
        return;
      }

      setPlaylist(playlistData);
      
      // Check if playlist is favorited by current user
      if (user) {
        const favorited = await PlaylistService.isFavorited(playlistData.id);
        setIsFavorited(favorited);
      }
      
      // Record the view
      await PlaylistService.recordPlaylistView(playlistData.id);
    } catch (err) {
      setError('Failed to load playlist');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  const handleTrackClick = (trackId: string) => {
    if (user) {
      // User is logged in, navigate directly to track page
      navigate(`/track/${trackId}`);
    } else {
      // User is not logged in, show login/register modal
      // This will be handled by the track card component
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!playlist) return;

    try {
      setFavoriteLoading(true);
      const newFavorited = await PlaylistService.toggleFavorite(playlist.id);
      setIsFavorited(newFavorited);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    // Refresh the page to update the user state and favorite status
    window.location.reload();
  };

  const getProducerName = () => {
    if (!playlist?.producer) return 'Unknown Producer';
    
    const { first_name, last_name, email } = playlist.producer;
    if (first_name && last_name) {
      return `${first_name} ${last_name}`;
    } else if (first_name) {
      return first_name;
    } else {
      return email.split('@')[0];
    }
  };

  const getProducerImage = () => {
    if (!playlist?.producer) return null;
    
    // First try to use the producer's avatar_path
    if (playlist.producer.avatar_path) {
      // If it's a full URL, use it directly
      if (playlist.producer.avatar_path.startsWith('http')) {
        return playlist.producer.avatar_path;
      }
      
      // If it's a path, use the same approach as ProfilePhotoUpload
      try {
        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(playlist.producer.avatar_path.replace('profile-photos/', ''));
        return publicUrl;
      } catch (error) {
        console.error('Error getting producer image URL:', error);
      }
    }
    
    // Then try to use the playlist's photo_url (which might be the producer's photo)
    if (playlist.photo_url) {
      // If it's a full URL, use it directly
      if (playlist.photo_url.startsWith('http')) {
        return playlist.photo_url;
      }
      
      // If it's a path, use the same approach as ProfilePhotoUpload
      try {
        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(playlist.photo_url.replace('profile-photos/', ''));
        return publicUrl;
      } catch (error) {
        console.error('Error getting playlist photo URL:', error);
      }
    }
    
    return null;
  };

  const getTotalDuration = () => {
    if (!playlist?.tracks) return '0:00';
    
    const totalSeconds = playlist.tracks.reduce((total, playlistTrack) => {
      const track = playlistTrack.track;
      if (!track?.duration) {
        return total;
      }
      
      // Handle different duration formats
      let duration = track.duration;
      
      // If duration is in seconds (number), convert to MM:SS format
      if (typeof duration === 'number') {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      
      // Parse MM:SS format
      if (typeof duration === 'string') {
        const parts = duration.split(':');
        if (parts.length === 2) {
          const minutes = parseInt(parts[0]) || 0;
          const seconds = parseInt(parts[1]) || 0;
          const trackSeconds = (minutes * 60) + seconds;
          return total + trackSeconds;
        } else if (parts.length === 1) {
          // If it's just seconds
          const seconds = parseInt(parts[0]) || 0;
          return total + seconds;
        }
      }
      
      return total;
    }, 0);
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Playlist Not Found</h1>
          <p className="text-gray-400">This playlist may be private or no longer available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative z-10 container mx-auto px-4 py-12">
          {/* Producer Info */}
          <div className="flex items-center space-x-6 mb-8">
            <div className="relative">
                             {getProducerImage() ? (
                 <img
                   src={getProducerImage()!}
                   alt={getProducerName()}
                   className="w-24 h-24 rounded-full object-cover border-4 border-white/20"
                   onError={(e) => {
                     e.currentTarget.style.display = 'none';
                     e.currentTarget.nextElementSibling?.classList.remove('hidden');
                   }}
                 />
               ) : null}
               <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white/20 ${getProducerImage() ? 'hidden' : ''}`}>
                 <User className="w-12 h-12 text-white" />
               </div>
              {playlist.logo_url && (
                <img
                  src={playlist.logo_url}
                  alt="Company Logo"
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full object-cover border-2 border-white"
                />
              )}
            </div>
            
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{getProducerName()}</h1>
              {playlist.company_name && (
                <div className="flex items-center space-x-2 text-gray-300 mb-2">
                  <Building className="w-4 h-4" />
                  <span>{playlist.company_name}</span>
                </div>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="flex items-center space-x-1">
                  <Music className="w-4 h-4" />
                  <span>{playlist.tracks.length} tracks</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{getTotalDuration()}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Playlist Info */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <h2 className="text-5xl font-bold text-white">{playlist.name}</h2>
              {user && (
                <button
                  onClick={handleToggleFavorite}
                  className="p-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                  title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                  disabled={favoriteLoading}
                >
                  {favoriteLoading ? (
                    <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-red-400"></div>
                  ) : (
                    <Heart className={`w-6 h-6 ${isFavorited ? 'text-red-400 fill-current' : 'text-gray-400'}`} />
                  )}
                </button>
              )}
            </div>
            {playlist.description && (
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                {playlist.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tracks Section */}
      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            {/* Tracks Header */}
            <div className="bg-white/10 px-6 py-4 border-b border-white/10">
              <h3 className="text-xl font-semibold text-white">Track List</h3>
            </div>

            {/* Tracks List */}
            <div className="divide-y divide-white/10">
              {playlist.tracks.length === 0 ? (
                <div className="p-8 text-center">
                  <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No tracks in this playlist yet.</p>
                </div>
              ) : (
                playlist.tracks.map((playlistTrack, index) => {
                  const track = playlistTrack.track;
                  if (!track) return null;

                  const genres = parseArrayField(track.genres);
                  const moods = parseArrayField(track.moods);

                  return (
                    <div key={playlistTrack.id} className="p-6 hover:bg-white/5 transition-colors">
                      <div className="flex items-center space-x-4">
                        {/* Track Number */}
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white">
                          {index + 1}
                        </div>

                                                 {/* Track Image */}
                         <div className="relative">
                           <img
                             src={track.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop'}
                             alt={track.title}
                             className="w-16 h-16 object-cover rounded-lg"
                           />
                         </div>

                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-white truncate">{track.title}</h4>
                          <p className="text-gray-400 truncate">{track.artist}</p>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {genres.slice(0, 2).map((genre, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                              >
                                {genre}
                              </span>
                            ))}
                            {moods.slice(0, 2).map((mood, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full"
                              >
                                {mood}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Track Duration */}
                        <div className="text-gray-400 text-sm">
                          {track.duration || '3:30'}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTrackClick(track.id)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="View track details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleToggleFavorite}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Add to favorites"
                            disabled={favoriteLoading}
                          >
                            {favoriteLoading ? (
                              <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-red-400"></div>
                            ) : (
                              <Heart className={`w-4 h-4 ${isFavorited ? 'text-red-400' : 'text-gray-400'}`} />
                            )}
                          </button>
                        </div>
                      </div>

                                             {/* Audio Player */}
                       <div className="mt-4">
                         <PlaylistTrackAudioPlayer 
                           track={track}
                           audioId={`playlist-track-${track.id}`}
                         />
                       </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Call to Action Section */}
          <div className="mt-8 text-center">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to License These Tracks?
              </h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Thank you for selecting tracks from {getProducerName()}. 
                Log in or create a FREE account to license these tracks directly!
              </p>
              
                             <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                 <button
                   onClick={() => setShowLoginModal(true)}
                   className="btn-primary px-8 py-3 text-lg"
                 >
                   Log In to Your Account
                 </button>
                 <button
                   onClick={() => setShowLoginModal(true)}
                   className="btn-secondary px-8 py-3 text-lg"
                 >
                   Create FREE Account
                 </button>
               </div>
              
              <p className="text-sm text-gray-400 mt-4">
                Join thousands of music supervisors and content creators who trust MyBeatFi for their music licensing needs.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-gray-400 text-sm">
            <p>Powered by MyBeatFi • Professional Music Licensing Platform</p>
                     </div>
         </div>
       </div>

       {/* Login Modal */}
       <LoginModal
         isOpen={showLoginModal}
         onClose={() => setShowLoginModal(false)}
         onLoginSuccess={handleLoginSuccess}
       />
     </div>
   );
 }
