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
import { useServiceLevel } from '../hooks/useServiceLevel';

// Inside your page component:
<AIRecommendationWidget />

const TRACKS_PER_PAGE = 20;

// Synonym expansion map for flexible search
const synonymsMap: { [key: string]: string[] } = {
  // Genres
  jazz: ['jazzy', 'smooth', 'groovy', 'swing', 'bluesy', 'soulful'],
  hiphop: ['rap', 'trap', 'drill', 'grime', 'hip hop', 'hip-hop'],
  electronic: ['edm', 'techno', 'house', 'trance', 'dubstep', 'electronic dance'],
  rock: ['rocky', 'guitar', 'electric', 'hard rock', 'classic rock'],
  pop: ['popular', 'mainstream', 'radio', 'chart'],
  classical: ['orchestral', 'symphonic', 'orchestra', 'symphony'],
  country: ['western', 'folk', 'americana', 'bluegrass'],
  rnb: ['r&b', 'rhythm and blues', 'soul', 'neo soul', 'rnb'],
  
  // Moods
  energetic: ['upbeat', 'high energy', 'powerful', 'intense', 'dynamic', 'energetic'],
  peaceful: ['calm', 'relaxing', 'serene', 'tranquil', 'soothing', 'peaceful'],
  uplifting: ['inspiring', 'motivational', 'positive', 'encouraging', 'uplifting'],
  dramatic: ['intense', 'emotional', 'powerful', 'epic', 'dramatic'],
  romantic: ['love', 'passionate', 'intimate', 'sweet', 'romantic'],
  mysterious: ['dark', 'moody', 'atmospheric', 'haunting', 'mysterious'],
  funky: ['groovy', 'rhythmic', 'danceable', 'funky'],
  melancholic: ['sad', 'melancholy', 'sorrowful', 'emotional', 'melancholic'],
  
  // Instruments
  guitar: ['acoustic guitar', 'electric guitar', 'bass guitar', 'guitar'],
  piano: ['keyboard', 'keys', 'piano'],
  drums: ['drum', 'percussion', 'beat', 'drums'],
  vocals: ['voice', 'singing', 'vocal', 'vocals'],
  synth: ['synthesizer', 'electronic', 'synth'],
  bass: ['bass guitar', 'bass', 'low end'],
  violin: ['fiddle', 'violin', 'string'],
  saxophone: ['sax', 'saxophone', 'brass'],
  
  // Media Types
  television: ['tv', 'television', 'broadcast', 'network'],
  film: ['movie', 'cinema', 'film', 'motion picture'],
  podcast: ['podcast', 'audio', 'broadcast'],
  youtube: ['youtube', 'video', 'online'],
  commercial: ['advertisement', 'ad', 'commercial', 'marketing'],
  gaming: ['video game', 'game', 'gaming', 'interactive'],
  social: ['social media', 'instagram', 'tiktok', 'social'],
  corporate: ['business', 'corporate', 'professional', 'commercial']
};

// Helper function to expand search terms with synonyms
const expandSearchTerms = (searchTerms: string[]): string[] => {
  const expandedTerms = new Set<string>();
  
  searchTerms.forEach(term => {
    const lowerTerm = term.toLowerCase();
    expandedTerms.add(lowerTerm);
    
    // Add synonyms for this term
    if (synonymsMap[lowerTerm]) {
      synonymsMap[lowerTerm].forEach(synonym => {
        expandedTerms.add(synonym.toLowerCase());
      });
    }
    
    // Check if this term is a synonym of any main term
    Object.entries(synonymsMap).forEach(([mainTerm, synonyms]) => {
      if (synonyms.includes(lowerTerm)) {
        expandedTerms.add(mainTerm);
        synonyms.forEach(synonym => {
          expandedTerms.add(synonym.toLowerCase());
        });
      }
    });
  });
  
  return Array.from(expandedTerms);
};

// Helper function to calculate match score for a track
const calculateMatchScore = (track: any, searchTerms: string[]): number => {
  let score = 0;
  const expandedTerms = expandSearchTerms(searchTerms);
  
  // Check genres (+3 for each match)
  const trackGenres = parseArrayField(track.genres);
  trackGenres.forEach((genre: string) => {
    if (expandedTerms.some(term => genre.toLowerCase().includes(term))) {
      score += 3;
    }
  });
  
  // Check sub-genres (+2 for each match)
  const trackSubGenres = parseArrayField(track.sub_genres);
  trackSubGenres.forEach((subGenre: string) => {
    if (expandedTerms.some(term => subGenre.toLowerCase().includes(term))) {
      score += 2;
    }
  });
  
  // Check moods (+2 for each match)
  const trackMoods = parseArrayField(track.moods);
  trackMoods.forEach((mood: string) => {
    if (expandedTerms.some(term => mood.toLowerCase().includes(term))) {
      score += 2;
    }
  });
  
  // Check media usage (+1 for each match)
  const trackMediaUsage = parseArrayField(track.media_usage);
  trackMediaUsage.forEach((mediaType: string) => {
    if (expandedTerms.some(term => mediaType.toLowerCase().includes(term))) {
      score += 1;
    }
  });
  
  // Check instruments (+1 for each match)
  const trackInstruments = parseArrayField(track.instruments);
  trackInstruments.forEach((instrument: string) => {
    if (expandedTerms.some(term => instrument.toLowerCase().includes(term))) {
      score += 1;
    }
  });
  
  return score;
};

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
  const { level, hasAISearch, hasDeepMedia } = useServiceLevel();

  useEffect(() => {
    // Get search params
    const query = searchParams.get('q')?.toLowerCase().trim() || '';
    const genres = searchParams.get('genres')?.split(',').filter(Boolean) || [];
    const subGenres = searchParams.get('subGenres')?.split(',').filter(Boolean) || [];
    const moods = searchParams.get('moods')?.split(',').filter(Boolean) || [];
    const instruments = searchParams.get('instruments')?.split(',').filter(Boolean) || [];
    const mediaTypes = searchParams.get('mediaTypes')?.split(',').filter(Boolean) || [];
    const minBpm = searchParams.get('minBpm');
    const maxBpm = searchParams.get('maxBpm');
    const trackId = searchParams.get('track');

    // Create filters object
    const filters = {
      query,
      genres,
      subGenres,
      moods,
      instruments,
      mediaTypes,
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
          instruments,
          media_usage,
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
          producer:profiles!track_producer_id (
            id,
            first_name,
            last_name,
            email,
            avatar_path
          )
        `)
        .is('deleted_at', null)
        .eq('is_sync_only', false); // Exclude sync-only tracks from main catalog

      // If a specific track ID is provided, fetch only that track
      if (filters?.trackId) {
        query = query.eq('id', filters.trackId);
      } else {
        // Apply BPM filters first (these are always applied)
        if (filters?.minBpm !== undefined) {
          query = query.gte('bpm', filters.minBpm);
        }
        if (filters?.maxBpm !== undefined) {
          query = query.lte('bpm', filters.maxBpm);
        }

        // Build flexible search with synonym expansion
        const searchTerms: string[] = [];
        
        // Add text query terms
        if (filters?.query) {
          searchTerms.push(...filters.query.split(/\s+/).filter(Boolean));
        }
        
        // Add filter terms
        if (filters?.genres?.length) searchTerms.push(...filters.genres);
        if (filters?.subGenres?.length) searchTerms.push(...filters.subGenres);
        if (filters?.moods?.length) searchTerms.push(...filters.moods);
        if (filters?.instruments?.length) searchTerms.push(...filters.instruments);
        if (filters?.mediaTypes?.length) searchTerms.push(...filters.mediaTypes);

        if (searchTerms.length > 0) {
          // Route to appropriate search based on service level
          if (hasAISearch || hasDeepMedia) {
            // Enhanced search for AI Search or Deep Media clients
            const searchPayload = {
              query: filters?.query || '',
              genres: filters?.genres || [],
              subgenres: hasAISearch ? (filters?.subGenres || []) : [],
              moods: filters?.moods || [],
              instruments: hasAISearch ? (filters?.instruments || []) : [],
              usageTypes: hasDeepMedia ? (filters?.mediaTypes || []) : [],
              limit: TRACKS_PER_PAGE
            };

            try {
              const response = await fetch('https://yciqkebqlajqbpwlujma.supabase.co/functions/v1/search-tracks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(searchPayload)
              });

              const searchData = await response.json();
              
              if (searchData.ok && searchData.results) {
                // Format the results to match our expected structure
                const formattedTracks = searchData.results.map((track: any) => ({
                  id: track.id,
                  title: track.title || 'Untitled',
                  artist: track.artist || 'Unknown Artist',
                  genres: parseArrayField(track.genres),
                  subGenres: parseArrayField(track.sub_genres),
                  moods: parseArrayField(track.moods),
                  instruments: parseArrayField(track.instruments),
                  mediaUsage: parseArrayField(track.media_usage),
                  duration: track.duration || '3:30',
                  bpm: track.bpm,
                  audioUrl: track.audio_url,
                  image: track.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
                  hasStingEnding: track.has_sting_ending,
                  isOneStop: track.is_one_stop,
                  mp3Url: track.mp3_url,
                  trackoutsUrl: track.trackouts_url,
                  stemsUrl: track.stems_url,
                  hasVocals: track.has_vocals || false,
                  isSyncOnly: track.is_sync_only || false,
                  producerId: track.track_producer_id || '',
                  producer: track.producer ? {
                    id: track.producer.id,
                    firstName: track.producer.first_name || '',
                    lastName: track.producer.last_name || '',
                    email: track.producer.email || '',
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
                  leaseAgreementUrl: '',
                  searchScore: track.relevance || 0
                }));

                setTracks(formattedTracks);
                setHasMore(formattedTracks.length >= TRACKS_PER_PAGE);
                return;
              }
            } catch (searchError) {
              console.error('Enhanced search failed, falling back to simple search:', searchError);
              // Fall back to simple search if enhanced search fails
            }
          } else {
            // Normal search for basic clients - use simple Supabase query
            console.log('Using normal search for service level:', level);
            // Continue with the existing simple query logic below
          }
        }
      }

      // Add pagination
      const from = (currentPage - 1) * TRACKS_PER_PAGE;
      const to = from + TRACKS_PER_PAGE - 1;
      query = query.range(from, to);

      // Order by most recent first initially
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

        // Calculate scores and sort by relevance if there are search terms
        let scoredTracks = data.filter(track => track && track.id);
        
        if (filters?.query || filters?.genres?.length || filters?.moods?.length || 
            filters?.instruments?.length || filters?.mediaTypes?.length) {
          
          const searchTerms: string[] = [];
          if (filters?.query) searchTerms.push(...filters.query.split(/\s+/).filter(Boolean));
          if (filters?.genres?.length) searchTerms.push(...filters.genres);
          if (filters?.subGenres?.length) searchTerms.push(...filters.subGenres);
          if (filters?.moods?.length) searchTerms.push(...filters.moods);
          if (filters?.instruments?.length) searchTerms.push(...filters.instruments);
          if (filters?.mediaTypes?.length) searchTerms.push(...filters.mediaTypes);
          
          // Calculate scores for each track
          scoredTracks = scoredTracks.map(track => ({
            ...track,
            _searchScore: calculateMatchScore(track, searchTerms)
          }));
          
          // Sort by score (highest first) and then by creation date
          scoredTracks.sort((a, b) => {
            if (b._searchScore !== a._searchScore) {
              return b._searchScore - a._searchScore;
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        }

        const formattedTracks = scoredTracks.map(track => {
            return {
              id: track.id,
              title: track.title || 'Untitled',
              artist:
                track.producer?.first_name ||
                track.producer?.email?.split('@')[0] ||
                'Unknown Artist',
              genres: parseArrayField(track.genres),
              subGenres: parseArrayField(track.sub_genres),
              moods: parseArrayField(track.moods),
            instruments: parseArrayField(track.instruments),
            mediaUsage: parseArrayField(track.media_usage),
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
              producer: track.producer ? {
                id: track.producer.id,
                firstName: track.producer.first_name || '',
                lastName: track.producer.last_name || '',
                email: track.producer.email || '',
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
            leaseAgreementUrl: '',
            searchScore: track._searchScore || 0
            };
          });

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
      moods: filters.moods?.map((m: string) => m.toLowerCase().trim()),
      instruments: filters.instruments?.map((i: string) => i.toLowerCase().trim()),
      mediaTypes: filters.mediaTypes?.map((mt: string) => mt.toLowerCase().trim())
    };

    // Update URL with search params
    const params = new URLSearchParams();
    if (normalizedFilters.query) params.set('q', normalizedFilters.query);
    if (normalizedFilters.genres?.length) params.set('genres', normalizedFilters.genres.join(','));
    if (normalizedFilters.subGenres?.length) params.set('subGenres', normalizedFilters.subGenres.join(','));
    if (normalizedFilters.moods?.length) params.set('moods', normalizedFilters.moods.join(','));
    if (normalizedFilters.instruments?.length) params.set('instruments', normalizedFilters.instruments.join(','));
    if (normalizedFilters.mediaTypes?.length) params.set('mediaTypes', normalizedFilters.mediaTypes.join(','));
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
