import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Sliders, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { SearchBox } from './SearchBox';
import { TrackCard } from './TrackCard';
import { Track } from '../types';
import { parseArrayField } from '../lib/utils';
import AIRecommendationWidget from './AIRecommendationWidget';
import { useDynamicSearchData } from '../hooks/useDynamicSearchData';

// Inside your page component:
<AIRecommendationWidget />

const TRACKS_PER_PAGE = 20;

export function CatalogPage() {
  const { user, accountType } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [membershipActive, setMembershipActive] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<any>(null);
  const { genres, subGenres, moods } = useDynamicSearchData();

  useEffect(() => {
    // Get search params
    const query = searchParams.get('q')?.toLowerCase().trim() || '';
    const genres = searchParams.get('genres')?.split(',').filter(Boolean) || [];
    const subGenres = searchParams.get('subGenres')?.split(',').filter(Boolean) || [];
    const moods = searchParams.get('moods')?.split(',').filter(Boolean) || [];
    const minBpm = searchParams.get('minBpm');
    const maxBpm = searchParams.get('maxBpm');
    const trackId = searchParams.get('track');

    // Create filters object
    const filters = {
      query,
      genres,
      subGenres,
      moods,
      minBpm: minBpm ? parseInt(minBpm) : undefined,
      maxBpm: maxBpm ? parseInt(maxBpm) : undefined,
      trackId
    };

    // Reset page and tracks when filters change
    setPage(1);
    setTracks([]);
    setHasMore(true);
    setCurrentFilters(filters);

    // Fetch tracks with filters
    fetchTracks(filters, 1);
  }, [searchParams]);

  const fetchTracks = async (filters?: any, currentPage: number = 1) => {
    try {
      if (currentPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

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
          stems_url,
          has_vocals,
          vocals_usage_type,
          is_sync_only,
          track_producer_id,
          profiles!track_producer_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .is('deleted_at', null)
        .eq('is_sync_only', false); // Exclude sync-only tracks from main catalog

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
              variations.push('hip hop', 'hip-hop', 'hiphop', 'rap', 'trap', 'drill', 'hip hop music', 'hip-hop music');
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

      // Add pagination
      const from = (currentPage - 1) * TRACKS_PER_PAGE;
      const to = from + TRACKS_PER_PAGE - 1;
      query = query.range(from, to);

      // Order by most recent first
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        // Debug: Log the first track's data to see what we're getting
        if (data.length > 0 && process.env.NODE_ENV === 'development') {
          console.log('First track data:', {
            id: data[0].id,
            title: data[0].title,
            audio_url: data[0].audio_url,
            trackouts_url: data[0].trackouts_url,
            stems_url: data[0].stems_url
          });
        }

        const formattedTracks = data
          .filter(track => track && track.id)
          .map(track => ({
            id: track.id,
            title: track.title || 'Untitled',
            artist:
              track.profiles?.[0]?.first_name ||
              track.profiles?.[0]?.email?.split('@')[0] ||
              'Unknown Artist',
            genres: parseArrayField(track.genres),
            subGenres: parseArrayField(track.sub_genres),
            moods: parseArrayField(track.moods),
            duration: track.duration || '3:30',
            bpm: track.bpm,
            audioUrl: track.audio_url,
            image:
              track.image_url ||
              'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
            hasStingEnding: track.has_sting_ending,
            isOneStop: track.is_one_stop,
            mp3Url: track.mp3_url,
            trackoutsUrl: track.trackouts_url,
            stemsUrl: track.stems_url,
            hasVocals: track.has_vocals || false,
            isSyncOnly: track.is_sync_only || false,
            producerId: track.track_producer_id || '',
            producer: track.profiles?.[0] ? {
              id: track.profiles[0].id,
              firstName: track.profiles[0].first_name || '',
              lastName: track.profiles[0].last_name || '',
              email: track.profiles[0].email || '',
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

        if (currentPage === 1) {
          setTracks(formattedTracks);
        } else {
          setTracks(prev => [...prev, ...formattedTracks]);
        }

        setHasMore(formattedTracks.length === TRACKS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = async (filters: any) => {
    // Convert search terms to lowercase and remove extra spaces
    const normalizedFilters = {
      ...filters,
      query: filters.query?.toLowerCase().trim(),
      genres: filters.genres?.map((g: string) => g.toLowerCase().trim()), // Convert to lowercase for database
      subGenres: filters.subGenres?.map((sg: string) => sg.toLowerCase().trim()), // Convert to lowercase for database
      moods: filters.moods?.map((m: string) => m.toLowerCase().trim())
    };

    // Update URL with search params
    const params = new URLSearchParams();
    if (normalizedFilters.query) params.set('q', normalizedFilters.query);
    if (normalizedFilters.genres?.length) params.set('genres', normalizedFilters.genres.join(','));
    if (normalizedFilters.subGenres?.length) params.set('subGenres', normalizedFilters.subGenres.join(','));
    if (normalizedFilters.moods?.length) params.set('moods', normalizedFilters.moods.join(','));
    if (normalizedFilters.minBpm) params.set('minBpm', normalizedFilters.minBpm.toString());
    if (normalizedFilters.maxBpm) params.set('maxBpm', normalizedFilters.maxBpm.toString());

    // Update URL without reloading the page
    navigate(`/catalog?${params.toString()}`, { replace: true });
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTracks(currentFilters, nextPage);
    }
  };

  const handleTrackSelect = (track: Track) => {
    navigate(`/track/${track.id}`);
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
        <h1 className="text-3xl font-bold text-white mb-6">Music Catalog</h1>
        <SearchBox onSearch={handleSearch} />
      </div>

      {!user && (
        <div className="mb-8 p-6 glass-card rounded-lg text-center">
          <p className="text-xl text-white mb-6">
            Preview our catalog below. Sign up or login to access our complete library and start licensing tracks.
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

      {user && accountType === 'client' && !membershipActive && (
        <div className="mb-8 p-4 glass-card rounded-lg">
          <p className="text-yellow-400">
            Your membership has expired. Please{' '}
            <button
              onClick={() => navigate('/pricing')}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              renew your membership here
            </button>
            .
          </p>
        </div>
      )}

      {tracks.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-lg">
          <p className="text-gray-400 text-lg">No tracks found matching your search criteria.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {tracks.map((track) =>
              track && track.id ? (
                <TrackCard
                  key={track.id}
                  track={track}
                  onSelect={() => handleTrackSelect(track)}
                />
              ) : null
            )}
          </div>

          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-primary flex items-center justify-center mx-auto"
              >
                {loadingMore ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Load More Tracks
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
