import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Plus, Music, Play, Pause } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Track } from '../types';
import { parseArrayField } from '../lib/utils';
import { AudioPlayer } from './AudioPlayer';
import { useSignedUrl } from '../hooks/useSignedUrl';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { formatDuration } from '../utils/dateUtils';

interface CatalogBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistId: string;
  onTrackAdded: () => void;
  accountType?: string;
}

// Track Image Component with Signed URL
const TrackImage = ({ imageUrl, title, className }: { 
  imageUrl: string; 
  title: string; 
  className: string;
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2; // Limit retries to avoid infinite loops

  // If it's already a public URL (like Unsplash), use it directly
  if (imageUrl && imageUrl.startsWith('https://')) {
    return (
      <img
        src={imageUrl}
        alt={title}
        className={className}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop';
        }}
      />
    );
  }

  // For file paths, use signed URL with hardcoded bucket name
  const { signedUrl, loading, error } = useSignedUrl('track-images', imageUrl);

  // Retry logic for failed signed URLs
  useEffect(() => {
    if (error && retryCount < maxRetries) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount]);

  if (loading) {
    return (
      <div className={`${className} bg-white/5 flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <img
        src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop"
        alt={title}
        className={className}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop';
        }}
      />
    );
  }

  return (
    <img
      src={signedUrl}
      alt={title}
      className={className}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop';
      }}
    />
  );
};

export function CatalogBrowserModal({ 
  isOpen, 
  onClose, 
  playlistId, 
  onTrackAdded,
  accountType = 'client'
}: CatalogBrowserModalProps) {
  const { user } = useUnifiedAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addingTrack, setAddingTrack] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTracks();
      loadFilters();
    }
  }, [isOpen, currentPage, searchTerm, selectedGenre, selectedMood]);

  const loadFilters = async () => {
    try {
      // Build base query for filters
      let genreQuery = supabase
        .from('tracks')
        .select('genres')
        .not('genres', 'is', null)
        .is('deleted_at', null);

      let moodQuery = supabase
        .from('tracks')
        .select('moods')
        .not('moods', 'is', null)
        .is('deleted_at', null);

      // Filter based on account type
      if (accountType !== 'client' && user) {
        genreQuery = genreQuery.eq('track_producer_id', user.id);
        moodQuery = moodQuery.eq('track_producer_id', user.id);
      }

      // Load genres
      const { data: genreData } = await genreQuery;
      const allGenres = new Set<string>();
      genreData?.forEach(track => {
        const trackGenres = parseArrayField(track.genres);
        trackGenres.forEach(genre => allGenres.add(genre));
      });
      setGenres(Array.from(allGenres).sort());

      // Load moods
      const { data: moodData } = await moodQuery;
      const allMoods = new Set<string>();
      moodData?.forEach(track => {
        const trackMoods = parseArrayField(track.moods);
        trackMoods.forEach(mood => allMoods.add(mood));
      });
      setMoods(Array.from(allMoods).sort());
    } catch (err) {
      console.error('Error loading filters:', err);
    }
  };

  const loadTracks = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('tracks')
        .select(`
          id,
          title,
          artist,
          genres,
          sub_genres,
          moods,
          instruments,
          media_usage,
          duration,
          bpm,
          audio_url,
          image_url,
          has_sting_ending,
          is_one_stop,
          mp3_url,
          trackouts_url,
          stems_url,
          has_vocals,
          is_sync_only,
          track_producer_id,
                      producer:profiles(
              id,
              first_name,
              last_name,
              email,
              avatar_path
            )
        `, { count: 'exact' })
        .is('deleted_at', null);

      // Filter tracks based on account type
      if (accountType === 'client') {
        // Clients can see all tracks from the catalog
        query = query.order('created_at', { ascending: false });
      } else {
        // Artists, rights holders, and producers can only see their own tracks
        if (user) {
          query = query.eq('track_producer_id', user.id);
        } else {
          // If no user, return empty result
          setTracks([]);
          setTotalPages(1);
          setLoading(false);
          return;
        }
        query = query.order('created_at', { ascending: false });
      }

      // Apply filters
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`);
      }

      if (selectedGenre) {
        query = query.contains('genres', [selectedGenre]);
      }

      if (selectedMood) {
        query = query.contains('moods', [selectedMood]);
      }

      // Apply pagination
      const pageSize = 12;
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: tracksData, error: tracksError, count } = await query;

      if (tracksError) throw tracksError;

      const formattedTracks = tracksData?.map(track => ({
        ...track,
        genres: parseArrayField(track.genres),
        subGenres: parseArrayField(track.sub_genres),
        moods: parseArrayField(track.moods),
        instruments: parseArrayField(track.instruments),
        mediaUsage: parseArrayField(track.media_usage),
        audioUrl: track.mp3_url || track.audio_url,
        imageUrl: track.image_url,
        producerId: track.track_producer_id,
        producer: track.producer
      })) || [];

      setTracks(formattedTracks);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (err) {
      console.error('Error loading tracks:', err);
      setError('Failed to load tracks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrack = async (trackId: string) => {
    try {
      setAddingTrack(trackId);
      
      const { error } = await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: playlistId,
          track_id: trackId,
          position: 0 // Will be updated by the database trigger
        });

      if (error) throw error;

      onTrackAdded();
    } catch (err) {
      console.error('Error adding track to playlist:', err);
      setError('Failed to add track to playlist');
    } finally {
      setAddingTrack(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedGenre('');
    setSelectedMood('');
    setCurrentPage(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-blue-900/90 rounded-xl p-6 max-w-6xl w-full mx-4 shadow-lg border border-blue-500/40 max-h-[90vh] overflow-y-auto">
                 <div className="flex items-center justify-between mb-6">
           <div>
             <h3 className="text-2xl font-semibold text-white">
               {accountType === 'client' ? 'Browse Catalog' : 'Your Tracks'}
             </h3>
             {accountType !== 'client' && (
               <p className="text-gray-400 text-sm mt-1">
                 Select from your uploaded tracks to add to this playlist
               </p>
             )}
           </div>
           <button
             onClick={onClose}
             className="text-gray-400 hover:text-white transition-colors"
           >
             <X className="w-6 h-6" />
           </button>
         </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                 <input
                   type="text"
                   placeholder={accountType === 'client' ? "Search tracks..." : "Search your tracks..."}
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                 />
              </div>
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="flex gap-4">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Genres</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>

            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Moods</option>
              {moods.map(mood => (
                <option key={mood} value={mood}>{mood}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Tracks Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="bg-white/5 rounded-lg p-4 border border-gray-600 hover:border-blue-500/50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <TrackImage
                      imageUrl={track.imageUrl}
                      title={track.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{track.title}</h4>
                      {track.artist && (
                        <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {track.genres.slice(0, 2).map((genre, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-gray-400 text-xs">
                          {formatDuration(track.duration || '--:--')}
                        </span>
                        <button
                          onClick={() => handleAddTrack(track.id)}
                          disabled={addingTrack === track.id}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors disabled:opacity-50 flex items-center"
                        >
                          {addingTrack === track.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-t border-white mr-1"></div>
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3 mr-1" />
                              Add
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-white">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
