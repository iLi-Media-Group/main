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

// Synonym expansion map for flexible search - now loaded from database
// This will be replaced by the useSynonyms hook

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
  const normalized = normalizeText(word);
  
  // Add the original normalized word
  variations.add(normalized);
  
  // Add partial matches (for "hip" matching "hip hop")
  if (normalized.length >= 3) {
    variations.add(normalized);
    // Add shorter versions for partial matching
    for (let i = 3; i <= normalized.length; i++) {
      variations.add(normalized.substring(0, i));
    }
  }
  
  // Add space/hyphen/underscore variations
  const spaceVariations = [
    normalized,
    normalized.replace(/\s+/g, ''),
    normalized.replace(/\s+/g, '-'),
    normalized.replace(/\s+/g, '_'),
    normalized.replace(/-/g, ' '),
    normalized.replace(/-/g, ''),
    normalized.replace(/-/g, '_'),
    normalized.replace(/_/g, ' '),
    normalized.replace(/_/g, '-'),
    normalized.replace(/_/g, '')
  ];
  
  spaceVariations.forEach(variation => {
    if (variation && variation.length > 0) {
      variations.add(variation);
    }
  });
  
  return Array.from(variations);
};

// Helper function to expand search terms with synonyms and comprehensive variations
const expandSearchTerms = (searchTerms: string[], synonymsMap: { [key: string]: string[] }): string[] => {
  const expandedTerms = new Set<string>();
  
  // Filter out stop words first
  const filteredTerms = filterStopWords(searchTerms);
  
  filteredTerms.forEach(term => {
    const lowerTerm = term.toLowerCase();
    
    // Add the original term and its variations
    const termVariations = generateWordVariations(lowerTerm);
    termVariations.forEach(variation => expandedTerms.add(variation));
    
    // Add synonyms for this term
    if (synonymsMap[lowerTerm]) {
      synonymsMap[lowerTerm].forEach(synonym => {
        const synonymVariations = generateWordVariations(synonym);
        synonymVariations.forEach(variation => expandedTerms.add(variation));
      });
    }
    
    // Check if this term is a synonym of any main term
    Object.entries(synonymsMap).forEach(([mainTerm, synonyms]) => {
      if (synonyms.includes(lowerTerm)) {
        const mainTermVariations = generateWordVariations(mainTerm);
        mainTermVariations.forEach(variation => expandedTerms.add(variation));
        
        synonyms.forEach(synonym => {
          const synonymVariations = generateWordVariations(synonym);
          synonymVariations.forEach(variation => expandedTerms.add(variation));
        });
      }
    });
    
    // Add comprehensive variations for hip-hop
    if (lowerTerm === 'hiphop' || lowerTerm === 'hip hop' || lowerTerm === 'hip-hop' || lowerTerm === 'hip') {
      const hipHopVariations = [
        'hiphop', 'hip hop', 'hip-hop', 'hip_hop_rap', 'rap', 'trap', 'drill', 'grime',
        'hip hop music', 'hip-hop music', 'hiphop music', 'hip hop rap',
        'hip-hop rap', 'hiphop rap', 'rap music', 'trap music', 'drill music',
        'urban', 'street', 'gangsta', 'conscious', 'underground', 'mainstream'
      ];
      
      hipHopVariations.forEach(variation => {
        const allVariations = generateWordVariations(variation);
        allVariations.forEach(v => expandedTerms.add(v));
      });
    }
    
    // Add comprehensive variations for R&B
    if (lowerTerm === 'rnb' || lowerTerm === 'r&b' || lowerTerm === 'rhythm and blues' || lowerTerm === 'rnb') {
      const rnbVariations = [
        'rnb', 'r&b', 'rhythm and blues', 'rnb_soul', 'soul', 'neo soul',
        'contemporary r&b', 'urban', 'rhythm and blues music'
      ];
      
      rnbVariations.forEach(variation => {
        const allVariations = generateWordVariations(variation);
        allVariations.forEach(v => expandedTerms.add(v));
      });
    }
    
    // Add comprehensive variations for electronic
    if (lowerTerm === 'edm' || lowerTerm === 'electronic' || lowerTerm === 'electronic dance' || lowerTerm === 'edm') {
      const electronicVariations = [
        'edm', 'electronic', 'electronic dance', 'electronic_dance', 'techno',
        'house', 'trance', 'dubstep', 'electronic music', 'edm music'
      ];
      
      electronicVariations.forEach(variation => {
        const allVariations = generateWordVariations(variation);
        allVariations.forEach(v => expandedTerms.add(v));
      });
    }
  });
  
  return Array.from(expandedTerms);
};

// Helper function to check if a track field contains any of the search terms
const fieldContainsTerms = (fieldValue: any, searchTerms: string[]): { matched: boolean; matchedTerms: string[] } => {
  if (!fieldValue) return { matched: false, matchedTerms: [] };
  
  const matchedTerms: string[] = [];
  const fieldText = Array.isArray(fieldValue) ? fieldValue.join(' ').toLowerCase() : String(fieldValue).toLowerCase();
  const normalizedFieldText = normalizeText(fieldText);
  
  searchTerms.forEach(term => {
    const normalizedTerm = normalizeText(term);
    
    // Check for exact match
    if (normalizedFieldText.includes(normalizedTerm)) {
      matchedTerms.push(term);
    } else {
      // Check for partial matches
      const termVariations = generateWordVariations(term);
      for (const variation of termVariations) {
        if (normalizedFieldText.includes(variation)) {
          matchedTerms.push(term);
          break;
        }
      }
    }
  });
  
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
  for (const term of expandedTerms) { // Use expandedTerms instead of searchTerms
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
  
  // Check genre matches
  const genreMatch = fieldContainsTerms(track.genres, expandedTerms);
  if (genreMatch.matched) {
    score += 6 * genreMatch.matchedTerms.length; // +6 per matched term
    genreMatch.matchedTerms.forEach(term => matchedTerms.add(term));
  }
  
  // Check sub-genre matches
  const subGenreMatch = fieldContainsTerms(track.sub_genres, expandedTerms);
  if (subGenreMatch.matched) {
    score += 5 * subGenreMatch.matchedTerms.length; // +5 per matched term
    subGenreMatch.matchedTerms.forEach(term => matchedTerms.add(term));
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
      score -= (1 - genreMatchRatio) * 20;
    } else {
      // All genre terms matched - bonus
      score += 10;
    }
  }
  
  // Bonus for tracks that match multiple search terms
  const matchRatio = matchedTerms.size / expandedTerms.length;
  if (matchRatio > 0.5) {
    score += matchRatio * 5;
  }
  
  // Bonus for exact matches vs partial matches
  const exactMatches = Array.from(matchedTerms).filter(term => {
    const normalizedTerm = normalizeText(term);
    const trackText = normalizeText(track.title + ' ' + track.artist + ' ' + (track.genres || []).join(' '));
    return trackText.includes(normalizedTerm);
  });
  
  score += exactMatches.length * 2; // +2 bonus for each exact match
  
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
  const [filters, setFilters] = useState<any>(null);
  const [membershipActive, setMembershipActive] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<any>(null);
  const { genres, subGenres, moods } = useDynamicSearchData();
  const { level, hasAISearch, hasDeepMedia } = useServiceLevel();
  const { synonyms: synonymsMap, loading: synonymsLoading } = useSynonyms();

     useEffect(() => {
     // Get search params
     const query = searchParams.get('q')?.toLowerCase().trim() || '';
     const genres = searchParams.get('genres')?.split(',').filter(Boolean) || [];
     const subGenres = searchParams.get('subGenres')?.split(',').filter(Boolean) || [];
     const moods = searchParams.get('moods')?.split(',').filter(Boolean) || [];
     const instruments = searchParams.get('instruments')?.split(',').filter(Boolean) || [];
     const mediaTypes = searchParams.get('mediaTypes')?.split(',').filter(Boolean) || [];
     const syncOnly = searchParams.get('syncOnly') === 'true';
     const hasVocals = searchParams.get('hasVocals') === 'true';
     const excludeUnclearedSamples = searchParams.get('excludeUnclearedSamples') === 'true';
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
       syncOnly,
       hasVocals,
       excludeUnclearedSamples,
       minBpm: minBpm ? parseInt(minBpm) : undefined,
       maxBpm: maxBpm ? parseInt(maxBpm) : undefined,
       trackId
     };

         // Reset page and tracks when filters change
     setPage(1);
     setTracks([]);
     setHasMore(true);
     setCurrentFilters(filters);
     
     // Set filters state for categorization display
     setFilters(filters);

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
         .is('deleted_at', null);
         // Removed the .eq('is_sync_only', false) to include all tracks in main catalog

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
         
         // Apply Sync Only filter
         if (filters?.syncOnly === true) {
           query = query.eq('is_sync_only', true);
         } else if (filters?.syncOnly === false) {
           query = query.eq('is_sync_only', false);
         }
         
         // Apply Vocals filter
         if (filters?.hasVocals === true) {
           query = query.eq('has_vocals', true);
         } else if (filters?.hasVocals === false) {
           query = query.eq('has_vocals', false);
         }



        // Build flexible search with synonym expansion
        const searchTerms: string[] = [];
        
        // Add text query terms
        if (filters?.query) {
                      const queryTerms = filters.query.split(/\s+/).filter(Boolean);
            const filteredTerms = filterStopWords(queryTerms);
            searchTerms.push(...filteredTerms);
        }
        
        // Add filter terms
        if (filters?.genres?.length) searchTerms.push(...filters.genres);
        if (filters?.subGenres?.length) searchTerms.push(...filters.subGenres);
        if (filters?.moods?.length) searchTerms.push(...filters.moods);
        if (filters?.instruments?.length) searchTerms.push(...filters.instruments);
        if (filters?.mediaTypes?.length) searchTerms.push(...filters.mediaTypes);

        // Parse search query for special filters
        const searchQuery = filters?.query?.toLowerCase() || '';
        const hasSyncOnlyTerm = searchQuery.includes('sync only') || searchQuery.includes('sync-only') || searchQuery.includes('synconly');
        const hasVocalsTerm = searchQuery.includes('vocals') || searchQuery.includes('vocal') || searchQuery.includes('singing');

                 if (searchTerms.length > 0) {
           // For all search types, get ALL tracks and then filter/score them client-side
           // This ensures we get complete results for proper categorization
           console.log('Searching with terms:', searchTerms);
           
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

           const { data: allTracks, error } = await query;

           if (error) throw error;

           if (allTracks) {
             // Calculate scores for each track
             const scoredTracks = allTracks.map(track => ({
               ...track,
               _searchScore: calculateMatchScore(track, searchTerms, synonymsMap)
             }));

             // Filter out tracks with zero score (no matches)
             const matchingTracks = scoredTracks.filter(track => track._searchScore > 0);

             // Sort by score (highest first) and then by creation date
             matchingTracks.sort((a, b) => {
               if (b._searchScore !== a._searchScore) {
                 return b._searchScore - a._searchScore;
               }
               return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
             });

             // Format tracks for display
             const formattedTracks = matchingTracks.map(track => ({
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
             }));

             setTracks(formattedTracks);
             setHasMore(false); // No pagination for search results
             return;
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
          if (filters?.query) {
          const queryTerms = filters.query.split(/\s+/).filter(Boolean);
          const filteredTerms = filterStopWords(queryTerms);
          searchTerms.push(...filteredTerms);
        }
          if (filters?.genres?.length) searchTerms.push(...filters.genres);
          if (filters?.subGenres?.length) searchTerms.push(...filters.subGenres);
          if (filters?.moods?.length) searchTerms.push(...filters.moods);
          if (filters?.instruments?.length) searchTerms.push(...filters.instruments);
          if (filters?.mediaTypes?.length) searchTerms.push(...filters.mediaTypes);
          
          // Calculate scores for each track
          scoredTracks = scoredTracks.map(track => ({
            ...track,
            _searchScore: calculateMatchScore(track, searchTerms, synonymsMap)
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

     const handleSearch = async (searchFilters: any) => {
     // Convert search terms to lowercase and remove extra spaces
           const normalizedFilters = {
        ...searchFilters,
        query: searchFilters.query?.toLowerCase().trim(),
        genres: searchFilters.genres?.map((g: string) => g.toLowerCase().trim()), // Convert to lowercase for database
        subGenres: searchFilters.subGenres?.map((sg: string) => sg.toLowerCase().trim()), // Convert to lowercase for database
        moods: searchFilters.moods?.map((m: string) => m.toLowerCase().trim()),
        instruments: searchFilters.instruments?.map((i: string) => i.toLowerCase().trim()),
        mediaTypes: searchFilters.mediaTypes?.map((mt: string) => mt.toLowerCase().trim()),
        syncOnly: searchFilters.syncOnly,
        hasVocals: searchFilters.hasVocals,
        excludeUnclearedSamples: searchFilters.excludeUnclearedSamples
      };

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
      const trackSubGenres = parseArrayField(track.sub_genres).map(sg => sg.toLowerCase());
      const trackMoods = parseArrayField(track.moods).map(m => m.toLowerCase());
      const trackInstruments = parseArrayField(track.instruments).map(i => i.toLowerCase());
      const trackMediaUsage = parseArrayField(track.media_usage).map(mu => mu.toLowerCase());
      
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
      
      // Check how many search terms the track matches
      const matchedTerms = uniqueSearchTerms.filter(searchTerm => {
        // Check if any track attribute contains or matches the search term
        return Array.from(trackAttributes).some(attr => 
          attr.includes(searchTerm) || searchTerm.includes(attr)
        );
      });
      
      const matchRatio = matchedTerms.length / uniqueSearchTerms.length;
      
      // Exact match: track matches ALL search terms (100% match) OR has high score
      if ((matchRatio === 1 && uniqueSearchTerms.length > 0) || score >= 8) {
        exactMatches.push(track);
      }
      // Partial match: track matches SOME search terms (between 10% and 99%) OR has medium score
      else if ((matchRatio >= 0.1 && matchRatio < 1) || (score >= 3 && score < 8)) {
        partialMatches.push(track);
      }
      // Other tracks: low match ratio or no search terms but still relevant
      else if (score > 0) {
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
        <div className="text-center py-12 glass-card rounded-lg">
          <p className="text-gray-400 text-lg">No tracks found matching your search criteria.</p>
        </div>
      ) : (
        <>
                     {/* Check if this is a search result or just browsing */}
           {(filters?.query || filters?.genres?.length || filters?.moods?.length || 
            filters?.instruments?.length || filters?.mediaTypes?.length || 
            filters?.syncOnly !== undefined || filters?.hasVocals !== undefined) ? (
             // Search Results - Show categorized sections
             <div className="space-y-8">
               {/* Search Terms Display */}
                                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                   <h3 className="text-lg font-semibold text-white mb-2">Search Results</h3>
                   <div className="flex flex-wrap gap-2">
                   {filters?.query && (
                     <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm">
                       Query: "{filters.query}"
                     </span>
                   )}
                   {filters?.genres?.length > 0 && (
                     <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">
                       Genres: {filters.genres.join(', ')}
                     </span>
                   )}
                   {filters?.moods?.length > 0 && (
                     <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">
                       Moods: {filters.moods.join(', ')}
                     </span>
                   )}
                   {filters?.instruments?.length > 0 && (
                     <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm">
                       Instruments: {filters.instruments.join(', ')}
                     </span>
                   )}
                   {filters?.mediaTypes?.length > 0 && (
                     <span className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-sm">
                       Media Types: {filters.mediaTypes.join(', ')}
                     </span>
                   )}
                   {filters?.syncOnly !== undefined && (
                     <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm">
                       Sync Only: {filters.syncOnly ? 'Yes' : 'No'}
                     </span>
                   )}
                                       {filters?.hasVocals !== undefined && (
                      <span className="bg-teal-500/20 text-teal-300 px-3 py-1 rounded-full text-sm">
                        Vocals: {filters.hasVocals ? 'Yes' : 'No'}
                      </span>
                    )}
                    {filters?.excludeUnclearedSamples !== undefined && (
                      <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm">
                        Exclude Uncleared Samples: {filters.excludeUnclearedSamples ? 'Yes' : 'No'}
                      </span>
                    )}
                 </div>
               </div>

               {(() => {
                 const { exactMatches, partialMatches, otherTracks } = categorizeTracks(tracks);
                 
                 return (
                   <>
                     {/* Exact Matches */}
                     {exactMatches.length > 0 && (
                       <div>
                         <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                           <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-sm mr-3">
                             Exact Matches
                           </span>
                           {exactMatches.length} track{exactMatches.length !== 1 ? 's' : ''}
                         </h2>
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                           {exactMatches.map((track) =>
                             track && track.id ? (
                               <div key={track.id} className="relative">
                                 <div className="absolute inset-0 border-2 border-green-500/50 rounded-lg pointer-events-none z-10"></div>
                                 <TrackCard
                                   track={track}
                                   onSelect={() => handleTrackSelect(track)}
                                 />
                               </div>
                             ) : null
                           )}
                         </div>
                       </div>
                     )}

                     {/* Partial Matches */}
                     {partialMatches.length > 0 && (
                       <div>
                         <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                           <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-sm mr-3">
                             Partial Matches
                           </span>
                           {partialMatches.length} track{partialMatches.length !== 1 ? 's' : ''}
                         </h2>
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                           {partialMatches.map((track) =>
                             track && track.id ? (
                               <div key={track.id} className="relative">
                                 <div className="absolute inset-0 border-2 border-yellow-500/50 rounded-lg pointer-events-none z-10"></div>
                                 <TrackCard
                                   track={track}
                                   onSelect={() => handleTrackSelect(track)}
                                 />
                               </div>
                             ) : null
                           )}
                         </div>
                       </div>
                     )}

                     {/* Other Tracks */}
                     {otherTracks.length > 0 && (
                       <div>
                         <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                           <span className="bg-gray-500/20 text-gray-300 px-2 py-1 rounded-full text-sm mr-3">
                             Other Results
                           </span>
                           {otherTracks.length} track{otherTracks.length !== 1 ? 's' : ''}
                         </h2>
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                           {otherTracks.map((track) =>
                             track && track.id ? (
                               <div key={track.id} className="relative">
                                 <div className="absolute inset-0 border-2 border-gray-500/30 rounded-lg pointer-events-none z-10"></div>
                                 <TrackCard
                                   track={track}
                                   onSelect={() => handleTrackSelect(track)}
                                 />
                               </div>
                             ) : null
                           )}
                         </div>
                       </div>
                     )}
                   </>
                 );
               })()}
             </div>
                     ) : (
             // Regular browsing or fallback - Show all tracks with colored borders based on search score
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                 {tracks.map((track) =>
                   track && track.id ? (
                     <div key={track.id} className="relative">
                       {/* Color-coded border based on search score */}
                       {track.searchScore >= 10 && (
                         <div className="absolute inset-0 border-2 border-green-500/50 rounded-lg pointer-events-none z-10"></div>
                       )}
                       {track.searchScore >= 5 && track.searchScore < 10 && (
                         <div className="absolute inset-0 border-2 border-yellow-500/50 rounded-lg pointer-events-none z-10"></div>
                       )}
                       {track.searchScore > 0 && track.searchScore < 5 && (
                         <div className="absolute inset-0 border-2 border-gray-500/30 rounded-lg pointer-events-none z-10"></div>
                       )}
                       <TrackCard
                         track={track}
                         onSelect={() => handleTrackSelect(track)}
                       />
                     </div>
                   ) : null
                 )}
               </div>
           )}

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
