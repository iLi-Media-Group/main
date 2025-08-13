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

// Inside your page component:
<AIRecommendationWidget />

const TRACKS_PER_PAGE = 20;

// Common stop words to filter out from search
const STOP_WORDS = new Set([
  'and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'his', 'hers', 'ours', 'theirs'
]);

// Helper function to filter out stop words from search terms
const filterStopWords = (terms: string[]): string[] => {
  return terms.filter(term => {
    const lowerTerm = term.toLowerCase();
    return !STOP_WORDS.has(lowerTerm) && lowerTerm.length > 1;
  });
};

// Helper function to normalize text for searching (remove special chars, lowercase)
const normalizeText = (text: string): string => {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim();
};

// Helper function to tokenize text into searchable terms
const tokenizeText = (text: string): string[] => {
  return normalizeText(text)
    .split(/\s+/)
    .filter(term => term.length > 0);
};

// Helper function to generate word variations (partial matches, different formats)
const generateWordVariations = (word: string): string[] => {
  const variations = new Set<string>();
  const wordLower = word.toLowerCase();
  
  // Add original word
  variations.add(wordLower);
  
  // Add variations with different separators
  if (wordLower.includes(' ')) {
    variations.add(wordLower.replace(/\s+/g, ''));
    variations.add(wordLower.replace(/\s+/g, '-'));
    variations.add(wordLower.replace(/\s+/g, '_'));
  }
  
  if (wordLower.includes('-')) {
    variations.add(wordLower.replace(/-/g, ' '));
    variations.add(wordLower.replace(/-/g, ''));
  }
  
  if (wordLower.includes('_')) {
    variations.add(wordLower.replace(/_/g, ' '));
    variations.add(wordLower.replace(/_/g, ''));
  }
  
  // Add partial matches for words 3+ characters
  if (wordLower.length >= 3) {
    for (let i = 3; i <= wordLower.length; i++) {
      variations.add(wordLower.substring(0, i));
    }
  }
  
  return Array.from(variations);
};

// Helper function to expand search terms with synonyms and variations
const expandSearchTerms = (searchTerms: string[], synonymsMap: { [key: string]: string[] }): string[] => {
  const expandedTerms = new Set<string>();
  
  for (const term of searchTerms) {
    const termLower = term.toLowerCase();
    
    // Add original term
    expandedTerms.add(termLower);
    
    // Add variations
    const variations = generateWordVariations(term);
    variations.forEach(v => expandedTerms.add(v));
    
    // Add synonyms
    if (synonymsMap[termLower]) {
      synonymsMap[termLower].forEach(synonym => {
        expandedTerms.add(synonym.toLowerCase());
        // Also add variations of synonyms
        const synonymVariations = generateWordVariations(synonym);
        synonymVariations.forEach(v => expandedTerms.add(v));
      });
    }
  }
  
  return Array.from(expandedTerms);
};

// Helper function to calculate Levenshtein distance for fuzzy matching
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;
  
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[len2][len1];
};

// Helper function to check if a field contains any of the search terms
const fieldContainsTerms = (field: any, searchTerms: string[]): { matched: boolean; matchedTerms: string[] } => {
  if (!field || !searchTerms.length) return { matched: false, matchedTerms: [] };
  
  const fieldStr = Array.isArray(field) ? field.join(' ').toLowerCase() : String(field).toLowerCase();
  const matchedTerms: string[] = [];
  
  for (const term of searchTerms) {
    const termLower = term.toLowerCase();
    if (fieldStr.includes(termLower)) {
      matchedTerms.push(term);
    }
  }
  
  return { matched: matchedTerms.length > 0, matchedTerms };
};

// Helper function to calculate match score for a track
const calculateMatchScore = (track: any, searchTerms: string[], synonymsMap: { [key: string]: string[] }): number => {
  let score = 0;
  const expandedTerms = expandSearchTerms(searchTerms, synonymsMap);
  
  // Parse search terms for special filters
  const searchQuery = searchTerms.join(' ').toLowerCase();
  const hasSyncOnlyTerm = searchQuery.includes('sync only') || searchQuery.includes('sync-only') || searchQuery.includes('synconly');
  const hasVocalsTerm = searchQuery.includes('vocals') || searchQuery.includes('vocal') || searchQuery.includes('singing');
  
  // Track which search terms are matched
  const matchedTerms = new Set<string>();
  const genreTerms = new Set<string>();
  const mediaTerms = new Set<string>();
  
  // First pass: identify what type of terms we're dealing with
  for (const term of expandedTerms) {
    const termLower = term.toLowerCase();
    
    // Check if this is a genre term by looking for common genre keywords
    const genreKeywords = ['pop', 'rock', 'jazz', 'hip', 'hop', 'rap', 'country', 'blues', 'folk', 'electronic', 'edm', 'classical', 'r&b', 'rnb', 'soul', 'reggae', 'latin', 'world', 'ambient', 'chill', 'dance', 'house', 'techno', 'trance', 'dubstep', 'trap', 'drill', 'grime'];
    if (genreKeywords.some(keyword => termLower.includes(keyword))) {
      genreTerms.add(termLower);
    }
    
    // Check if this is a media type term
    const mediaKeywords = ['television', 'tv', 'commercial', 'film', 'movie', 'advertisement', 'radio', 'podcast', 'video', 'youtube', 'streaming', 'gaming', 'game', 'sports', 'fitness', 'corporate', 'business', 'retail', 'restaurant', 'hospitality', 'education', 'training', 'presentation', 'event', 'wedding', 'party', 'celebration'];
    if (mediaKeywords.some(keyword => termLower.includes(keyword))) {
      mediaTerms.add(termLower);
    }
  }
  
  // Check Sync Only (+8 for exact match when searching for sync only)
  if (hasSyncOnlyTerm && track.is_sync_only === true) {
    score += 8;
  }
  
  // Check Vocals (+8 for exact match when searching for vocals)
  if (hasVocalsTerm && track.has_vocals === true) {
    score += 8;
  }
  
  // Check title matches (highest priority)
  const titleMatch = fieldContainsTerms(track.title, expandedTerms);
  if (titleMatch.matched) {
    score += 10 * titleMatch.matchedTerms.length; // +10 per matched term
    titleMatch.matchedTerms.forEach(term => matchedTerms.add(term));
  }
  
  // Check artist matches (high priority)
  const artistMatch = fieldContainsTerms(track.artist, expandedTerms);
  if (artistMatch.matched) {
    score += 8 * artistMatch.matchedTerms.length; // +8 per matched term
    artistMatch.matchedTerms.forEach(term => matchedTerms.add(term));
  }
  
  // Check genre matches with hierarchy awareness
  const genreMatch = fieldContainsTerms(track.genres, expandedTerms);
  if (genreMatch.matched) {
    score += 6 * genreMatch.matchedTerms.length; // +6 per matched term
    genreMatch.matchedTerms.forEach(term => matchedTerms.add(term));
  }
  
  // Check sub-genre matches with higher priority for specific sub-genres
  const subGenreMatch = fieldContainsTerms(track.sub_genres, expandedTerms);
  if (subGenreMatch.matched) {
    // Higher score for sub-genre matches to prioritize specific genres over general ones
    score += 8 * subGenreMatch.matchedTerms.length; // +8 per matched term (higher than genre)
    subGenreMatch.matchedTerms.forEach(term => matchedTerms.add(term));
  }
  
  // Check for exact sub-genre matches (highest priority) - applies to ALL genres
  const trackSubGenres = parseArrayField(track.sub_genres).map(sg => sg.toLowerCase());
  for (const searchTerm of searchTerms) {
    const searchTermLower = searchTerm.toLowerCase();
    if (trackSubGenres.includes(searchTermLower)) {
      // Exact sub-genre match gets highest score for ANY genre
      score += 20; // +20 for exact sub-genre match (increased priority)
      matchedTerms.add(searchTerm);
    }
  }
  
  // Check for exact media usage matches (high priority)
  const trackMediaUsage = parseArrayField(track.media_usage).map(mu => mu.toLowerCase());
  for (const searchTerm of searchTerms) {
    const searchTermLower = searchTerm.toLowerCase();
    if (trackMediaUsage.includes(searchTermLower)) {
      // Exact media usage match gets high score
      score += 12; // +12 for exact media usage match
      matchedTerms.add(searchTerm);
    }
  }
  
  // Check mood matches
  const moodMatch = fieldContainsTerms(track.moods, expandedTerms);
  if (moodMatch.matched) {
    score += 4 * moodMatch.matchedTerms.length; // +4 per matched term
    moodMatch.matchedTerms.forEach(term => matchedTerms.add(term));
  }
  
  // Check instrument matches
  const instrumentMatch = fieldContainsTerms(track.instruments, expandedTerms);
  if (instrumentMatch.matched) {
    score += 3 * instrumentMatch.matchedTerms.length; // +3 per matched term
    instrumentMatch.matchedTerms.forEach(term => matchedTerms.add(term));
  }
  
  // Check media usage matches
  const mediaMatch = fieldContainsTerms(track.media_usage, expandedTerms);
  if (mediaMatch.matched) {
    score += 2 * mediaMatch.matchedTerms.length; // +2 per matched term
    mediaMatch.matchedTerms.forEach(term => matchedTerms.add(term));
  }
  
  // Heavy penalty for tracks that don't match genre terms when genre terms are present
  if (genreTerms.size > 0) {
    const matchedGenreTerms = Array.from(genreTerms).filter(term => matchedTerms.has(term));
    const genreMatchRatio = matchedGenreTerms.length / genreTerms.size;
    
    if (genreMatchRatio === 0) {
      // No genre terms matched - heavy penalty
      score -= 50;
    } else if (genreMatchRatio < 1) {
      // Some genre terms matched - moderate penalty
      score -= 20 * (1 - genreMatchRatio);
    }
  }
  
  // Bonus for tracks that match multiple search terms
  const matchRatio = matchedTerms.size / expandedTerms.length;
  if (matchRatio > 0.5) {
    score += matchRatio * 5;
  }
  
  // Fuzzy matching bonus for close matches
  for (const term of searchTerms) {
    const termLower = term.toLowerCase();
    const trackTitle = track.title?.toLowerCase() || '';
    const trackArtist = track.artist?.toLowerCase() || '';
    
    // Check fuzzy matches in title and artist
    if (levenshteinDistance(termLower, trackTitle) <= 2) {
      score += 3;
    }
    if (levenshteinDistance(termLower, trackArtist) <= 2) {
      score += 2;
    }
  }
  
  return Math.max(0, score); // Ensure score is never negative
};

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
    try {
      if (currentPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Parse search query for special filters
      const searchQuery = filters?.query?.toLowerCase() || '';
      const hasSyncOnlyTerm = searchQuery.includes('sync only') || searchQuery.includes('sync-only') || searchQuery.includes('synconly');
      const hasVocalsTerm = searchQuery.includes('vocals') || searchQuery.includes('vocal') || searchQuery.includes('singing');

      // Tokenize and expand search terms
      const searchWords = tokenizeText(filters?.query || '');
      const filteredWords = filterStopWords(searchWords);
      const expandedTerms = expandSearchTerms(filteredWords, synonymsMap || {});

      if (expandedTerms.length > 0) {
        // For all search types, get ALL tracks and then filter/score them client-side
        // This ensures we get complete results for proper categorization
        console.log('Searching with terms:', expandedTerms);
        
        // Build query with special filters
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

        // Apply special filters based on search terms
        if (hasSyncOnlyTerm) {
          query = query.eq('is_sync_only', true);
        }
        
        if (hasVocalsTerm) {
          query = query.eq('has_vocals', true);
        }

        // Apply persistent filters
        if (filters?.syncOnly === true) {
          query = query.eq('is_sync_only', true);
        }
        
        if (filters?.hasVocals === true) {
          query = query.eq('has_vocals', true);
        }

        // Apply sample clearance filter
        if (filters?.excludeUnclearedSamples === true) {
          query = query.eq('samples_cleared', true);
        }

        // Apply BPM filters
        if (filters?.minBpm !== undefined) {
          query = query.gte('bpm', filters.minBpm);
        }
        if (filters?.maxBpm !== undefined) {
          query = query.lte('bpm', filters.maxBpm);
        }

        const { data: allTracks, error } = await query;

        if (error) throw error;

        if (allTracks) {
          // Score and filter tracks based on search terms
          const scoredTracks = allTracks.map(track => ({
            ...track,
            _searchScore: calculateMatchScore(track, expandedTerms, synonymsMap || {})
          })).filter(track => track._searchScore > 0);

          // Sort by score (highest first)
          scoredTracks.sort((a, b) => (b._searchScore || 0) - (a._searchScore || 0));

          // Apply pagination
          const startIndex = (currentPage - 1) * TRACKS_PER_PAGE;
          const endIndex = startIndex + TRACKS_PER_PAGE;
          const paginatedTracks = scoredTracks.slice(startIndex, endIndex);

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
      } else {
        // No search terms - show all tracks with filters
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
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        // Apply persistent filters
        if (filters?.syncOnly === true) {
          query = query.eq('is_sync_only', true);
        }
        
        if (filters?.hasVocals === true) {
          query = query.eq('has_vocals', true);
        }

        // Apply sample clearance filter
        if (filters?.excludeUnclearedSamples === true) {
          query = query.eq('samples_cleared', true);
        }

        // Apply BPM filters
        if (filters?.minBpm !== undefined) {
          query = query.gte('bpm', filters.minBpm);
        }
        if (filters?.maxBpm !== undefined) {
          query = query.lte('bpm', filters.maxBpm);
        }

        const { data: tracks, error } = await query;

        if (error) throw error;

        if (tracks) {
          const formattedTracks = tracks.map(track => {
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
              searchScore: 0
            };
          });

          if (currentPage === 1) {
            setTracks(formattedTracks);
          } else {
            setTracks(prev => [...prev, ...formattedTracks]);
          }

          setHasMore(formattedTracks.length === TRACKS_PER_PAGE);
        }
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = async (searchFilters: any) => {
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

    // Save persistent filters
    savePersistentFilters({
      excludeUnclearedSamples: normalizedFilters.excludeUnclearedSamples,
      syncOnly: normalizedFilters.syncOnly,
      hasVocals: normalizedFilters.hasVocals
    });

    // Set filters for categorization
    setFilters(normalizedFilters);

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

  // Helper function to categorize tracks into sections
  const categorizeTracks = (tracks: Track[]) => {
    const exactMatches: Track[] = [];
    const partialMatches: Track[] = [];
    const otherTracks: Track[] = [];
    
    // Extract all search terms from filters
    const allSearchTerms: string[] = [];
    if (filters?.query) {
      const queryTerms = filters.query.split(/\s+/).filter(Boolean);
      const filteredTerms = filterStopWords(queryTerms);
      allSearchTerms.push(...filteredTerms);
    }
    if (filters?.genres?.length) allSearchTerms.push(...filters.genres);
    if (filters?.subGenres?.length) allSearchTerms.push(...filters.subGenres);
    if (filters?.moods?.length) allSearchTerms.push(...filters.moods);
    if (filters?.instruments?.length) allSearchTerms.push(...filters.instruments);
    if (filters?.mediaTypes?.length) allSearchTerms.push(...filters.mediaTypes);
    
    // Remove duplicates and convert to lowercase
    const uniqueSearchTerms = [...new Set(allSearchTerms.map(term => term.toLowerCase()))];
    
    tracks.forEach(track => {
      const score = track.searchScore || 0;
      
             // Check if track matches ALL search terms (exact match)
       const trackGenres = parseArrayField(track.genres).map(g => g.toLowerCase());
       const trackSubGenres = parseArrayField(track.subGenres).map(sg => sg.toLowerCase());
       const trackMoods = parseArrayField(track.moods).map(m => m.toLowerCase());
       const trackInstruments = parseArrayField(track.instruments).map(i => i.toLowerCase());
       const trackMediaUsage = parseArrayField(track.mediaUsage).map(mu => mu.toLowerCase());
      
      // Create a set of all track attributes for easy matching
      const trackAttributes = new Set([
        ...trackGenres,
        ...trackSubGenres,
        ...trackMoods,
        ...trackInstruments,
        ...trackMediaUsage,
        track.title?.toLowerCase() || '',
        track.artist?.toLowerCase() || ''
      ]);
      
      // Check how many search terms the track matches with specific requirements
      const matchedTerms = uniqueSearchTerms.filter(searchTerm => {
        // Check if any track attribute contains or matches the search term
        return Array.from(trackAttributes).some(attr => 
          attr.includes(searchTerm) || searchTerm.includes(attr)
        );
      });
      
      const matchRatio = matchedTerms.length / uniqueSearchTerms.length;
      
      // Check for specific requirements (vocals, sync-only, etc.)
      const searchQuery = uniqueSearchTerms.join(' ').toLowerCase();
      const requiresVocals = searchQuery.includes('vocals') || searchQuery.includes('vocal') || searchQuery.includes('singing');
      const requiresSyncOnly = searchQuery.includes('sync only') || searchQuery.includes('sync-only') || searchQuery.includes('synconly');
      const requiresTV = searchQuery.includes('tv') || searchQuery.includes('television') || searchQuery.includes('tv-friendly');
      
             // Check if track meets specific requirements
       const hasVocals = track.hasVocals === true;
       const isSyncOnly = track.isSyncOnly === true;
       const hasTV = parseArrayField(track.mediaUsage).some(usage => 
         usage.toLowerCase().includes('television') || usage.toLowerCase().includes('tv')
       );
      
      // Calculate requirement score
      let requirementScore = 0;
      if (requiresVocals && hasVocals) requirementScore += 1;
      if (requiresSyncOnly && isSyncOnly) requirementScore += 1;
      if (requiresTV && hasTV) requirementScore += 1;
      
      const totalRequirements = [requiresVocals, requiresSyncOnly, requiresTV].filter(Boolean).length;
      const requirementRatio = totalRequirements > 0 ? requirementScore / totalRequirements : 1;
      
      // Exact match: track matches ALL search terms AND meets ALL specific requirements
      if (matchRatio === 1 && requirementRatio === 1 && uniqueSearchTerms.length > 0) {
        exactMatches.push(track);
      }
      // High score match: track has very high search score even if not all terms match
      else if (score >= 15) {
        exactMatches.push(track);
      }
      // Partial match: track matches SOME search terms OR meets SOME requirements
      else if ((matchRatio >= 0.5 && matchRatio < 1) || (requirementRatio >= 0.5 && requirementRatio < 1) || (score >= 8 && score < 15)) {
        partialMatches.push(track);
      }
      // Other tracks: low match ratio but still relevant
      else if (score >= 3) {
        otherTracks.push(track);
      }
    });
    
    return { exactMatches, partialMatches, otherTracks };
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
          {/* Exact Matches */}
          {(() => {
            const { exactMatches } = categorizeTracks(tracks);
            return exactMatches.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Exact Matches</h2>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {exactMatches.map(track => (
                     <TrackCard
                       key={track.id}
                       track={track}
                       onSelect={() => handleTrackSelect(track)}
                     />
                   ))}
                 </div>
              </div>
            ) : null;
          })()}

          {/* Partial Matches */}
          {(() => {
            const { partialMatches } = categorizeTracks(tracks);
            return partialMatches.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Related Tracks</h2>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {partialMatches.map(track => (
                     <TrackCard
                       key={track.id}
                       track={track}
                       onSelect={() => handleTrackSelect(track)}
                     />
                   ))}
                 </div>
              </div>
            ) : null;
          })()}

          {/* Other Tracks */}
          {(() => {
            const { otherTracks } = categorizeTracks(tracks);
            return otherTracks.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Other Tracks</h2>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {otherTracks.map(track => (
                     <TrackCard
                       key={track.id}
                       track={track}
                       onSelect={() => handleTrackSelect(track)}
                     />
                   ))}
                 </div>
              </div>
            ) : null;
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
