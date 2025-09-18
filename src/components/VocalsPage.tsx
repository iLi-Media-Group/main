import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Track } from '../types';
import { TrackCard } from './TrackCard';
import { SearchBox } from './SearchBox';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { SyncProposalDialog } from './SyncProposalDialog';
import { useDynamicSearchData } from '../hooks/useDynamicSearchData';

export function VocalsPage() {
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { genres, subGenres, moods } = useDynamicSearchData();
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [showProposalDialog, setShowProposalDialog] = useState(false);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async (filters?: any) => {
    try {
      setLoading(true);
      let query = supabase
        .from('tracks')
        .select(`
          id,
          title,
          artist,
          genres,
          sub_genres,
          moods,
          bpm,
          audio_url,
          image_url,
          has_sting_ending,
          is_one_stop,
          duration,
          mp3_url,
          trackouts_url,
          has_vocals,
          is_sync_only,
          track_producer_id,
          producer:profiles!track_producer_id (
            id,
            first_name,
            last_name,
            display_name,
            email,
            avatar_path
          )
        `)
        .eq('has_vocals', true);

      // If a specific track ID is provided, fetch only that track
      if (filters?.trackId) {
        query = query.eq('id', filters.trackId);
      } else {
        // Build search conditions - make it more precise and require ALL conditions
        const searchConditions = [];

        // Apply BPM filters first (these are always applied)
        if (filters?.minBpm !== undefined) {
          query = query.gte('bpm', filters.minBpm);
        }
        if (filters?.maxBpm !== undefined) {
          query = query.lte('bpm', filters.maxBpm);
        }

        // Text search in title and artist - this should always work
        if (filters?.query) {
          searchConditions.push(`title.ilike.%${filters.query}%`);
          searchConditions.push(`artist.ilike.%${filters.query}%`);
          searchConditions.push(`genres.ilike.%${filters.query}%`);
          searchConditions.push(`sub_genres.ilike.%${filters.query}%`);
          searchConditions.push(`moods.ilike.%${filters.query}%`);
        }

        // Genre filtering - if genres are selected, use OR logic with flexible matching
        if (filters?.genres?.length > 0) {
          const genreConditions: string[] = [];
          
          // Create dynamic genre variations from database data
          const genreVariations: { [key: string]: string[] } = {};
          genres.forEach(genre => {
            const variations = [
              genre.name.toLowerCase(),
              genre.display_name.toLowerCase(),
              genre.name.toLowerCase().replace(/\s+/g, ''),
              genre.name.toLowerCase().replace(/\s+/g, '-'),
              genre.name.toLowerCase().replace(/\s+/g, '_'),
              genre.display_name.toLowerCase().replace(/\s+/g, ''),
              genre.display_name.toLowerCase().replace(/\s+/g, '-'),
              genre.display_name.toLowerCase().replace(/\s+/g, '_')
            ];
            
            // Add common variations for specific genres
            if (genre.name.toLowerCase().includes('hip_hop_rap')) {
              variations.push(
                'hip hop', 'hip-hop', 'hiphop', 'rap', 'trap', 'drill', 'grime',
                'hip hop music', 'hip-hop music', 'hiphop music', 'hip hop rap',
                'hip-hop rap', 'hiphop rap', 'rap music', 'trap music', 'drill music'
              );
            }
            if (genre.name.toLowerCase().includes('rnb_soul')) {
              variations.push('r&b', 'rnb', 'rhythm and blues', 'soul', 'neo soul');
            }
            if (genre.name.toLowerCase().includes('electronic_dance')) {
              variations.push('edm', 'electronic dance', 'techno', 'house', 'trance', 'electronic music', 'edm music');
            }
            if (genre.name.toLowerCase().includes('jazz')) {
              variations.push('jazzy', 'jazz music', 'smooth jazz', 'bebop', 'fusion');
            }
            if (genre.name.toLowerCase().includes('classical_orchestral')) {
              variations.push('orchestral', 'symphony', 'chamber', 'classical music', 'orchestra');
            }
            if (genre.name.toLowerCase().includes('world_global')) {
              variations.push('ethnic', 'cultural', 'traditional', 'world music');
            }
            if (genre.name.toLowerCase().includes('religious_inspirational')) {
              variations.push('gospel', 'spiritual', 'worship', 'religious music');
            }
            if (genre.name.toLowerCase().includes('childrens_family')) {
              variations.push('kids', 'children', 'nursery', 'childrens music', 'kids music');
            }
            if (genre.name.toLowerCase().includes('country_folk_americana')) {
              variations.push('country western', 'bluegrass', 'americana', 'country music');
            }
            
            genreVariations[genre.name] = [...new Set(variations)];
          });

          filters.genres.forEach((genre: string) => {
            const variations = genreVariations[genre.toLowerCase()] || [];
            const allVariations = [
              genre.toLowerCase(),
              ...variations.map(v => v.toLowerCase()),
              genre.toLowerCase().replace(/\s+/g, ''),
              genre.toLowerCase().replace(/\s+/g, '-'),
              genre.toLowerCase().replace(/\s+/g, '_')
            ];
            
            // Add partial match variations
            const genreWords = genre.toLowerCase().split(/[\s_-]+/);
            genreWords.forEach(word => {
              if (word.length >= 3) { // Only add meaningful partial matches
                allVariations.push(word);
              }
            });
            
            const uniqueVariations = [...new Set(allVariations)];
            uniqueVariations.forEach(variation => {
              genreConditions.push(`genres.ilike.%${variation}%`);
            });
          });
          query = query.or(genreConditions.join(','));
        }

        // Subgenre filtering - if subgenres are selected, use OR logic with flexible matching
        if (filters?.subGenres?.length > 0) {
          const subGenreConditions: string[] = [];
          filters.subGenres.forEach((subGenre: string) => {
            // Create multiple variations for each subgenre
            const variations = [
              subGenre.toLowerCase(),
              subGenre.toLowerCase().replace(/\s+/g, ''),
              subGenre.toLowerCase().replace(/\s+/g, '-'),
              subGenre.toLowerCase().replace(/\s+/g, '_')
            ];
            
            variations.forEach(variation => {
              subGenreConditions.push(`sub_genres.ilike.%${variation}%`);
            });
          });
          query = query.or(subGenreConditions.join(','));
        }

        // Mood filtering - if moods are selected, use OR logic with flexible matching
        if (filters?.moods?.length > 0) {
          const moodConditions: string[] = [];
          
          // Create dynamic mood variations from database data
          const moodVariations: { [key: string]: string[] } = {};
          moods.forEach(mood => {
            const variations = [
              mood.name.toLowerCase(),
              mood.display_name.toLowerCase()
            ];
            
            // Add common synonyms for moods
            if (mood.name.toLowerCase().includes('energetic')) {
              variations.push('upbeat', 'high energy', 'powerful', 'intense', 'dynamic');
            }
            if (mood.name.toLowerCase().includes('peaceful')) {
              variations.push('calm', 'relaxing', 'serene', 'tranquil', 'soothing');
            }
            if (mood.name.toLowerCase().includes('uplifting')) {
              variations.push('inspiring', 'motivational', 'positive', 'encouraging');
            }
            if (mood.name.toLowerCase().includes('dramatic')) {
              variations.push('intense', 'emotional', 'powerful', 'epic');
            }
            if (mood.name.toLowerCase().includes('romantic')) {
              variations.push('love', 'passionate', 'intimate', 'sweet');
            }
            if (mood.name.toLowerCase().includes('mysterious')) {
              variations.push('dark', 'moody', 'atmospheric', 'haunting');
            }
            if (mood.name.toLowerCase().includes('funky')) {
              variations.push('groovy', 'rhythmic', 'danceable');
            }
            if (mood.name.toLowerCase().includes('melancholic')) {
              variations.push('sad', 'melancholy', 'sorrowful', 'emotional');
            }
            
            moodVariations[mood.name] = [...new Set(variations)];
          });

          filters.moods.forEach((mood: string) => {
            const variations = moodVariations[mood.toLowerCase()] || [];
            const allVariations = [
              mood.toLowerCase(),
              ...variations.map(v => v.toLowerCase()),
              mood.toLowerCase().replace(/\s+/g, ''),
              mood.toLowerCase().replace(/\s+/g, '-'),
              mood.toLowerCase().replace(/\s+/g, '_')
            ];
            
            // Add partial match variations
            const moodWords = mood.toLowerCase().split(/[\s_-]+/);
            moodWords.forEach(word => {
              if (word.length >= 3) { // Only add meaningful partial matches
                allVariations.push(word);
              }
            });
            
            const uniqueVariations = [...new Set(allVariations)];
            uniqueVariations.forEach(variation => {
              moodConditions.push(`moods.ilike.%${variation}%`);
            });
          });
          query = query.or(moodConditions.join(','));
        }

        // Apply text search conditions with OR logic only for text search
        if (searchConditions.length > 0) {
          query = query.or(searchConditions.join(','));
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        // Filter out any tracks with undefined IDs before mapping
        const validTracks = data.filter(track => track && track.id);
        
        const formattedTracks = validTracks.map(track => ({
          id: track.id,
          title: track.title,
          artist: track.producer?.display_name || track.producer?.first_name || track.producer?.email?.split('@')[0] || 'Unknown Artist',
          genres: Array.isArray(track.genres)
            ? track.genres
            : track.genres?.split(',').map((g: string) => g.trim()) || [],
          subGenres: Array.isArray(track.sub_genres)
            ? track.sub_genres
            : track.sub_genres?.split(',').map((g: string) => g.trim()) || [],
          moods: Array.isArray(track.moods)
            ? track.moods
            : track.moods?.split(',').map((m: string) => m.trim()) || [],
          duration: track.duration || '3:30',
          bpm: track.bpm,
          audioUrl: track.audio_url,
                      image_url: track.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
          hasStingEnding: track.has_sting_ending,
          isOneStop: track.is_one_stop,
          mp3Url: track.mp3_url,
          trackoutsUrl: track.trackouts_url,
          hasVocals: track.has_vocals || false,
          isSyncOnly: track.is_sync_only || false,
          producerId: track.track_producer_id || '',
          producer: track.producer ? {
            id: track.producer.id,
            firstName: track.producer.display_name || track.producer.first_name || '',
            lastName: '',
            email: track.producer.email
          } : undefined,
          fileFormats: {
            stereoMp3: { format: ['MP3'], url: track.mp3_url || '' },
            stems: { format: ['WAV'], url: track.trackouts_url || '' },
            stemsWithVocals: { format: ['WAV'], url: track.trackouts_url || '' }
          },
          pricing: {
            stereoMp3: 0,
            stems: 0,
            stemsWithVocals: 0
          },
          leaseAgreementUrl: ''
        }));
        setTracks(formattedTracks);
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
      setError('Failed to load tracks');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: any) => {
    // Convert search terms to lowercase and remove extra spaces
    const normalizedFilters = {
      ...filters,
      query: filters.query?.toLowerCase().trim(),
      genres: filters.genres?.map((g: string) => g.toLowerCase().trim()), // Convert to lowercase for database
      subGenres: filters.subGenres?.map((sg: string) => sg.toLowerCase().trim()), // Convert to lowercase for database
      moods: filters.moods?.map((m: string) => m.toLowerCase().trim())
    };
    
    fetchTracks(normalizedFilters);
  };

  const handleTrackSelect = (track: Track) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (track.isSyncOnly) {
      setSelectedTrack(track);
      setShowProposalDialog(true);
    } else {
      navigate(`/license/${track.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Mic className="w-8 h-8 mr-3" />
          Licensable Full Tracks with Vocals
        </h1>
        <p className="text-gray-300 mb-6 text-lg">
          Browse our collection of full tracks featuring vocals. Perfect for TV shows and films, advertising campaigns, video game soundtracks, and corporate videos.
        </p>
        <SearchBox onSearch={handleSearch} />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-center">{error}</p>
        </div>
      )}

      {!user && (
        <div className="mb-8 p-6 glass-card rounded-lg text-center">
          <p className="text-xl text-white mb-6">
            Preview our vocal tracks below. Sign up or login to access our complete library and start licensing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/pricing')}
              className="btn-primary"
            >
              View Membership Options
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary"
            >
              Login to Your Account
            </button>
          </div>
        </div>
      )}

      {tracks.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-lg">
          <Mic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No vocal tracks found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              onSelect={handleTrackSelect}
            />
          ))}
        </div>
      )}

      {selectedTrack && (
        <SyncProposalDialog
          isOpen={showProposalDialog}
          onClose={() => {
            setShowProposalDialog(false);
            setSelectedTrack(null);
          }}
          track={selectedTrack}
        />
      )}
    </div>
  );
}
