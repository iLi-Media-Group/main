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
import { logSearchFromFilters } from '../lib/searchLogger';
import { useSynonyms } from '../hooks/useSynonyms';

const TRACKS_PER_PAGE = 20;

// World-class comprehensive search system
interface SearchResult {
  track: any;
  score: number;
  exactMatches: string[];
  partialMatches: string[];
  fuzzyMatches: string[];
}

function comprehensiveSearch(
  tracks: any[], 
  searchQuery: string, 
  genres: string[], 
  subGenres: string[],
  moods: string[], 
  subMoods: string[],
  instruments: string[], 
  subInstruments: string[],
  mediaTypes: string[],
  subMediaTypes: string[],
  synonymsMap: any
): SearchResult[] {
  console.log('🔍 Comprehensive Search - Query:', searchQuery);
  console.log('🔍 Filters - Genres:', genres, 'SubGenres:', subGenres, 'Moods:', moods, 'SubMoods:', subMoods);
  console.log('🔍 Filters - Instruments:', instruments, 'SubInstruments:', subInstruments);
  console.log('🔍 Filters - MediaTypes:', mediaTypes, 'SubMediaTypes:', subMediaTypes);
  console.log('🔍 Total tracks to search:', tracks.length);

  // If no search criteria, return all tracks with score 0
  const hasSearchCriteria = searchQuery?.trim() || 
    genres?.length || subGenres?.length || 
    moods?.length || subMoods?.length || 
    instruments?.length || subInstruments?.length || 
    mediaTypes?.length || subMediaTypes?.length;

  if (!hasSearchCriteria) {
    console.log('🔍 No search criteria, returning all tracks with score 0');
    return tracks.map(track => ({
      track,
      score: 0,
      exactMatches: [],
      partialMatches: [],
      fuzzyMatches: []
    }));
  }

  const query = searchQuery?.toLowerCase().trim() || '';

  // Expand search terms with synonyms
  let expandedTerms = new Set<string>();
  
  // Add the main query if it exists
  if (query) {
    expandedTerms.add(query);
  }
  
  // Add all filter terms
  [...genres, ...subGenres, ...moods, ...subMoods, ...instruments, ...subInstruments, ...mediaTypes, ...subMediaTypes]
    .forEach(term => {
      if (term) expandedTerms.add(term.toLowerCase());
    });

  // Add synonyms from our dictionary
  for (let [term, syns] of Object.entries(synonymsMap || {})) {
    const synonyms = syns as string[];
    if (query && query.includes(term.toLowerCase())) {
      synonyms.forEach((s: string) => expandedTerms.add(s.toLowerCase()));
    }
    if (query && synonyms.some((s: string) => query.includes(s.toLowerCase()))) {
      expandedTerms.add(term.toLowerCase());
      synonyms.forEach((s: string) => expandedTerms.add(s.toLowerCase()));
    }
  }

  const expandedTermsArray = Array.from(expandedTerms);
  console.log('🔍 Expanded Terms:', expandedTermsArray);

  // Fuzzy match helper (Levenshtein distance)
  function levenshtein(a: string, b: string): number {
    const matrix = [];
    let i;
    for (i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    let j;
    for (j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (i = 1; i <= b.length; i++) {
      for (j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(
              matrix[i][j - 1] + 1,   // insertion
              matrix[i - 1][j] + 1    // deletion
            )
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  function isFuzzyMatch(str: string, term: string): boolean {
    return levenshtein(str.toLowerCase(), term.toLowerCase()) <= 2; // allow 2 edits
  }

  // Score and categorize tracks
  const results: SearchResult[] = tracks.map(track => {
    let score = 0;
    const exactMatches: string[] = [];
    const partialMatches: string[] = [];
    const fuzzyMatches: string[] = [];

    // Create searchable text from all track fields
    const searchableText = [
      track.title,
      track.artist,
      track.genres?.join(" "),
      track.sub_genres?.join(" "),
      track.moods?.join(" "),
      track.instruments?.join(" "),
      track.media_usage?.join(" ")
    ].filter(Boolean).join(" ").toLowerCase();

    // Check each expanded term against the track
    for (let term of expandedTermsArray) {
      // Check sub-genres (highest priority - 20 points)
      if (track.sub_genres?.some((sg: string) => sg.toLowerCase().includes(term))) {
        score += 20;
        exactMatches.push(`sub-genre: ${term}`);
      }
      // Check sub-moods (highest priority - 20 points)
      else if (track.sub_moods?.some((sm: string) => sm.toLowerCase().includes(term))) {
        score += 20;
        exactMatches.push(`sub-mood: ${term}`);
      }
      // Check sub-instruments (highest priority - 20 points)
      else if (track.sub_instruments?.some((si: string) => si.toLowerCase().includes(term))) {
        score += 20;
        exactMatches.push(`sub-instrument: ${term}`);
      }
      // Check sub-media types (highest priority - 20 points)
      else if (track.sub_media_types?.some((smt: string) => smt.toLowerCase().includes(term))) {
        score += 20;
        exactMatches.push(`sub-media-type: ${term}`);
      }
      // Check media usage (high priority - 12 points)
      else if (track.media_usage?.some((mu: string) => mu.toLowerCase().includes(term))) {
        score += 12;
        exactMatches.push(`media-usage: ${term}`);
      }
      // Check genres (medium priority - 6 points)
      else if (track.genres?.some((g: string) => g.toLowerCase().includes(term))) {
        score += 6;
        exactMatches.push(`genre: ${term}`);
      }
      // Check moods (medium priority - 6 points)
      else if (track.moods?.some((m: string) => m.toLowerCase().includes(term))) {
        score += 6;
        exactMatches.push(`mood: ${term}`);
      }
      // Check instruments (medium priority - 6 points)
      else if (track.instruments?.some((i: string) => i.toLowerCase().includes(term))) {
        score += 6;
        exactMatches.push(`instrument: ${term}`);
      }
      // Check other fields (lower priority - 3 points)
      else if (searchableText.includes(term)) {
        score += 3;
        exactMatches.push(`other: ${term}`);
      }
      // Check partial matches (lower priority - 2 points)
      else if (searchableText.split(" ").some(word => word.startsWith(term))) {
        score += 2;
        partialMatches.push(term);
      }
      // Check fuzzy matches (lowest priority - 1 point)
      else if (searchableText.split(" ").some(word => isFuzzyMatch(word, term))) {
        score += 1;
        fuzzyMatches.push(term);
      }
    }

    return {
      track,
      score,
      exactMatches,
      partialMatches,
      fuzzyMatches
    };
  });

  // Sort by score (highest first)
  results.sort((a, b) => b.score - a.score);

  console.log('🔍 Search Results - Total:', results.length);
  console.log('🔍 Top 3 results:', results.slice(0, 3).map(r => ({
    title: r.track.title,
    score: r.score,
    exactMatches: r.exactMatches.length,
    partialMatches: r.partialMatches.length,
    fuzzyMatches: r.fuzzyMatches.length
  })));

  return results;
}

// Categorize tracks into Exact / Partial / Other based on search results
function categorizeTracks(searchResults: SearchResult[]): {
  exact: any[];
  partial: any[];
  other: any[];
} {
  const exact: any[] = [];
  const partial: any[] = [];
  const other: any[] = [];

  searchResults.forEach(result => {
    const track = result.track;
    
    // Exact matches: High score with exact matches
    if (result.score >= 10 && result.exactMatches.length > 0) {
      exact.push(track);
    }
    // Partial matches: Medium score with partial or fuzzy matches
    else if (result.score >= 3 && (result.partialMatches.length > 0 || result.fuzzyMatches.length > 0)) {
      partial.push(track);
    }
    // Other: Low score or no specific matches
    else {
      other.push(track);
    }
  });

  console.log('📊 Categorization Results:', {
    exact: exact.length,
    partial: partial.length,
    other: other.length,
    total: searchResults.length
  });

  return { exact, partial, other };
}



// Helper function to get persistent filter preferences
const getPersistentFilters = (): any => {
  try {
    const stored = localStorage.getItem('mybeatfi_search_filters');
    return stored ? JSON.parse(stored) : {
      excludeUnclearedSamples: false,
      syncOnly: undefined,
      hasVocals: undefined
    };
  } catch {
    return {
      excludeUnclearedSamples: false,
      syncOnly: undefined,
      hasVocals: undefined
    };
  }
};

// Helper function to save persistent filter preferences
const savePersistentFilters = (filters: any): void => {
  try {
    localStorage.setItem('mybeatfi_search_filters', JSON.stringify(filters));
  } catch (error) {
    console.error('Failed to save filter preferences:', error);
  }
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
  const [filters, setFilters] = useState<any>(null);
  const [membershipActive, setMembershipActive] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<any>(null);
  const { genres, subGenres, moods } = useDynamicSearchData();
  const { level, hasAISearch, hasDeepMedia } = useServiceLevel();
  const { synonyms: synonymsMap, loading: synonymsLoading } = useSynonyms();

  useEffect(() => {
    // Get search params
    const query = searchParams.get('q')?.toLowerCase().trim() || '';
    const genresParam = searchParams.get('genres')?.split(',').filter(Boolean) || [];
    const subGenresParam = searchParams.get('subGenres')?.split(',').filter(Boolean) || [];
    const moodsParam = searchParams.get('moods')?.split(',').filter(Boolean) || [];
    const instrumentsParam = searchParams.get('instruments')?.split(',').filter(Boolean) || [];
    const mediaTypesParam = searchParams.get('mediaTypes')?.split(',').filter(Boolean) || [];
    const syncOnlyParam = searchParams.get('syncOnly');
    const hasVocalsParam = searchParams.get('hasVocals');
    const excludeUnclearedSamplesParam = searchParams.get('excludeUnclearedSamples');
    const minBpmParam = searchParams.get('minBpm');
    const maxBpmParam = searchParams.get('maxBpm');

    // Get persistent filters
    const persistentFilters = getPersistentFilters();

    // Combine URL params with persistent filters
    const combinedFilters = {
      query,
      genres: genresParam,
      subGenres: subGenresParam,
      moods: moodsParam,
      instruments: instrumentsParam,
      mediaTypes: mediaTypesParam,
      syncOnly: syncOnlyParam !== null ? syncOnlyParam === 'true' : persistentFilters.syncOnly,
      hasVocals: hasVocalsParam !== null ? hasVocalsParam === 'true' : persistentFilters.hasVocals,
      excludeUnclearedSamples: excludeUnclearedSamplesParam !== null ? excludeUnclearedSamplesParam === 'true' : persistentFilters.excludeUnclearedSamples,
      minBpm: minBpmParam ? parseInt(minBpmParam) : undefined,
      maxBpm: maxBpmParam ? parseInt(maxBpmParam) : undefined
    };

    setCurrentFilters(combinedFilters);
    fetchTracks(combinedFilters, 1);
  }, [searchParams, synonymsLoading]);

  const fetchTracks = async (filters?: any, currentPage: number = 1) => {
    console.log('🎵 fetchTracks called with filters:', filters);
    try {
      if (currentPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // UNIFIED PIPELINE: Always fetch tracks with basic constraints
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
          created_at,
          contains_loops,
          contains_samples,
          contains_splice_loops,
          samples_cleared,
          producer:profiles!track_producer_id (
            id,
            first_name,
            last_name,
            email,
            avatar_path
          )
        `)
        .is('deleted_at', null);

      // Apply basic filters (always applied)
      if (filters?.syncOnly === true) {
        query = query.eq('is_sync_only', true);
      }
      
      if (filters?.hasVocals === true) {
        query = query.eq('has_vocals', true);
      }

      if (filters?.excludeUnclearedSamples === true) {
        query = query.eq('samples_cleared', true);
      }

      if (filters?.minBpm !== undefined) {
        query = query.gte('bpm', filters.minBpm);
      }
      if (filters?.maxBpm !== undefined) {
        query = query.lte('bpm', filters.maxBpm);
      }

      // Get ALL tracks that match basic filters
      const { data: allTracks, error } = await query;

      console.log('🎵 Supabase query result:', {
        dataCount: allTracks?.length || 0,
        error: error?.message,
        hasData: !!allTracks,
        firstTrack: allTracks?.[0] ? {
          id: allTracks[0].id,
          title: allTracks[0].title,
          genres: allTracks[0].genres
        } : null
      });

      if (error) {
        console.error('🎵 Supabase query error:', error);
        throw error;
      }

      if (allTracks) {
        // COMPREHENSIVE SEARCH: Process through world-class search system
        const searchQuery = filters?.query || '';
        const genres = filters?.genres || [];
        const subGenres = filters?.subGenres || [];
        const moods = filters?.moods || [];
        const subMoods: string[] = []; // TODO: Add sub-moods support
        const instruments = filters?.instruments || [];
        const subInstruments: string[] = []; // TODO: Add sub-instruments support
        const mediaTypes = filters?.mediaTypes || [];
        const subMediaTypes: string[] = []; // TODO: Add sub-media-types support

        console.log('🎵 About to call comprehensiveSearch with:', {
          allTracksCount: allTracks.length,
          searchQuery,
          genres,
          subGenres,
          moods,
          subMoods,
          instruments,
          subInstruments,
          mediaTypes,
          subMediaTypes,
          synonymsMapKeys: Object.keys(synonymsMap || {})
        });

        // Debug: Show some sample tracks
        if (allTracks.length > 0) {
          console.log('🎵 Sample tracks:', allTracks.slice(0, 3).map(t => ({
            id: t.id,
            title: t.title,
            genres: t.genres,
            sub_genres: t.sub_genres,
            moods: t.moods,
            instruments: t.instruments,
            media_usage: t.media_usage
          })));
        }

        // Apply comprehensive search
        const searchResults = comprehensiveSearch(
          allTracks,
          searchQuery,
          genres,
          subGenres,
          moods,
          subMoods,
          instruments,
          subInstruments,
          mediaTypes,
          subMediaTypes,
          synonymsMap || {}
        );

        // Create a map of track IDs to search results for easy lookup
        const searchResultMap = new Map();
        searchResults.forEach(result => {
          searchResultMap.set(result.track.id, result);
        });

        // Extract tracks and sort by score (already sorted by comprehensiveSearch)
        let processedTracks = searchResults.map(result => result.track);

        // If no search criteria, sort by date (newest first)
        if (!searchQuery?.trim() && !genres?.length && !subGenres?.length && 
            !moods?.length && !subMoods?.length && !instruments?.length && 
            !subInstruments?.length && !mediaTypes?.length && !subMediaTypes?.length) {
          processedTracks.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }

        // Apply pagination AFTER processing
        const startIndex = (currentPage - 1) * TRACKS_PER_PAGE;
        const endIndex = startIndex + TRACKS_PER_PAGE;
        const paginatedTracks = processedTracks.slice(startIndex, endIndex);

        // Format tracks for display
        const formattedTracks = paginatedTracks.map(track => {
          const producer = Array.isArray(track.producer) ? track.producer[0] : track.producer;
          return {
            id: track.id,
            title: track.title || 'Untitled',
            artist: producer?.first_name || producer?.email?.split('@')[0] || 'Unknown Artist',
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
            producer: producer ? {
              id: producer.id,
              firstName: producer.first_name || '',
              lastName: producer.last_name || '',
              email: producer.email || '',
            } : undefined,
            fileFormats: {
              stereoMp3: {
                format: ['mp3'],
                url: track.mp3_url || ''
              },
              stems: {
                format: ['wav', 'aiff'],
                url: track.trackouts_url || ''
              },
              stemsWithVocals: {
                format: ['wav', 'aiff'],
                url: track.stems_url || ''
              }
            },
            pricing: {
              stereoMp3: 0,
              stems: 0,
              stemsWithVocals: 0
            },
            leaseAgreementUrl: '',
            searchScore: searchResultMap.get(track.id)?.score || 0
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

  const handleSearch = async (searchFilters: any) => {
    console.log('🚀 handleSearch called with:', searchFilters);
    
    // Convert search terms to lowercase and remove extra spaces
    const normalizedFilters = {
      ...searchFilters,
      query: searchFilters.query?.toLowerCase().trim(),
      genres: searchFilters.genres?.map((g: string) => g.toLowerCase().trim()),
      subGenres: searchFilters.subGenres?.map((sg: string) => sg.toLowerCase().trim()),
      moods: searchFilters.moods?.map((m: string) => m.toLowerCase().trim()),
      instruments: searchFilters.instruments?.map((i: string) => i.toLowerCase().trim()),
      mediaTypes: searchFilters.mediaTypes?.map((mt: string) => mt.toLowerCase().trim()),
      syncOnly: searchFilters.syncOnly,
      hasVocals: searchFilters.hasVocals,
      excludeUnclearedSamples: searchFilters.excludeUnclearedSamples
    };

    console.log('🚀 Normalized filters:', normalizedFilters);

    // Save persistent filters
    savePersistentFilters({
      excludeUnclearedSamples: normalizedFilters.excludeUnclearedSamples,
      syncOnly: normalizedFilters.syncOnly,
      hasVocals: normalizedFilters.hasVocals
    });

    // Set filters for categorization
    setFilters(normalizedFilters);
    setCurrentFilters(normalizedFilters);

    // Update URL with search params
    const params = new URLSearchParams();
    if (normalizedFilters.query) params.set('q', normalizedFilters.query);
    if (normalizedFilters.genres?.length) params.set('genres', normalizedFilters.genres.join(','));
    if (normalizedFilters.subGenres?.length) params.set('subGenres', normalizedFilters.subGenres.join(','));
    if (normalizedFilters.moods?.length) params.set('moods', normalizedFilters.moods.join(','));
    if (normalizedFilters.instruments?.length) params.set('instruments', normalizedFilters.instruments.join(','));
    if (normalizedFilters.mediaTypes?.length) params.set('mediaTypes', normalizedFilters.mediaTypes.join(','));
    if (normalizedFilters.syncOnly !== undefined) params.set('syncOnly', normalizedFilters.syncOnly.toString());
    if (normalizedFilters.hasVocals !== undefined) params.set('hasVocals', normalizedFilters.hasVocals.toString());
    if (normalizedFilters.excludeUnclearedSamples !== undefined) params.set('excludeUnclearedSamples', normalizedFilters.excludeUnclearedSamples.toString());
    if (normalizedFilters.minBpm) params.set('minBpm', normalizedFilters.minBpm.toString());
    if (normalizedFilters.maxBpm) params.set('maxBpm', normalizedFilters.maxBpm.toString());

    // Update URL without reloading the page
    navigate(`/catalog?${params.toString()}`, { replace: true });
    
    // IMMEDIATELY fetch tracks with the new filters
    console.log('🚀 Calling fetchTracks immediately with:', normalizedFilters);
    await fetchTracks(normalizedFilters, 1);
    
    // Log the search query to the database
    await logSearchFromFilters(normalizedFilters);
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
        <div className="text-center py-12">
          <p className="text-white text-lg mb-4">No tracks found matching your criteria.</p>
          <p className="text-gray-400">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {(() => {
            // Simple categorization based on search score
            const exact = tracks.filter(track => (track.searchScore || 0) >= 10);
            const partial = tracks.filter(track => (track.searchScore || 0) >= 3 && (track.searchScore || 0) < 10);
            const other = tracks.filter(track => (track.searchScore || 0) < 3);
            
            return (
              <>
                {/* Exact Matches */}
                {exact.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Exact Matches</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {exact.map((track: any) => (
                        <TrackCard
                          key={track.id}
                          track={track}
                          onSelect={() => handleTrackSelect(track)}
                          searchCategory="exact"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Partial Matches */}
                {partial.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Related Tracks</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {partial.map((track: any) => (
                        <TrackCard
                          key={track.id}
                          track={track}
                          onSelect={() => handleTrackSelect(track)}
                          searchCategory="partial"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Tracks */}
                {other.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Other Tracks</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {other.map((track: any) => (
                        <TrackCard
                          key={track.id}
                          track={track}
                          onSelect={() => handleTrackSelect(track)}
                          searchCategory="other"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="btn-primary"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
