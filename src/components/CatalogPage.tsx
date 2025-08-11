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

// Helper function to expand search terms with synonyms and comprehensive variations
const expandSearchTerms = (searchTerms: string[], synonymsMap: { [key: string]: string[] }): string[] => {
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
    
    // Add comprehensive variations for hip-hop
    if (lowerTerm === 'hiphop' || lowerTerm === 'hip hop' || lowerTerm === 'hip-hop') {
      expandedTerms.add('hiphop');
      expandedTerms.add('hip hop');
      expandedTerms.add('hip-hop');
      expandedTerms.add('hip_hop_rap');
      expandedTerms.add('rap');
      expandedTerms.add('trap');
      expandedTerms.add('drill');
      expandedTerms.add('grime');
      expandedTerms.add('hip hop music');
      expandedTerms.add('hip-hop music');
      expandedTerms.add('hiphop music');
      expandedTerms.add('hip hop rap');
      expandedTerms.add('hip-hop rap');
      expandedTerms.add('hiphop rap');
      expandedTerms.add('rap music');
      expandedTerms.add('trap music');
      expandedTerms.add('drill music');
    }
    
    // Add comprehensive variations for R&B
    if (lowerTerm === 'rnb' || lowerTerm === 'r&b' || lowerTerm === 'rhythm and blues') {
      expandedTerms.add('rnb');
      expandedTerms.add('r&b');
      expandedTerms.add('rhythm and blues');
      expandedTerms.add('rnb_soul');
      expandedTerms.add('soul');
      expandedTerms.add('neo soul');
      expandedTerms.add('contemporary r&b');
      expandedTerms.add('urban');
    }
    
    // Add comprehensive variations for electronic
    if (lowerTerm === 'edm' || lowerTerm === 'electronic' || lowerTerm === 'electronic dance') {
      expandedTerms.add('edm');
      expandedTerms.add('electronic');
      expandedTerms.add('electronic dance');
      expandedTerms.add('electronic_dance');
      expandedTerms.add('techno');
      expandedTerms.add('house');
      expandedTerms.add('trance');
      expandedTerms.add('dubstep');
      expandedTerms.add('electronic music');
      expandedTerms.add('edm music');
    }
    
    // Add space/hyphen/underscore variations for any term
    const variations = [
      lowerTerm,
      lowerTerm.replace(/\s+/g, ''),
      lowerTerm.replace(/\s+/g, '-'),
      lowerTerm.replace(/\s+/g, '_'),
      lowerTerm.replace(/-/g, ' '),
      lowerTerm.replace(/-/g, ''),
      lowerTerm.replace(/-/g, '_'),
      lowerTerm.replace(/_/g, ' '),
      lowerTerm.replace(/_/g, '-'),
      lowerTerm.replace(/_/g, '')
    ];
    
    variations.forEach(variation => {
      if (variation && variation.length > 0) {
        expandedTerms.add(variation);
      }
    });
  });
  
  return Array.from(expandedTerms);
};

// Helper function to calculate match score for a track
const calculateMatchScore = (track: any, searchTerms: string[], synonymsMap: { [key: string]: string[] }): number => {
  let score = 0;
  const expandedTerms = expandSearchTerms(searchTerms, synonymsMap);
  
  // Parse search terms for special filters
  const searchQuery = searchTerms.join(' ').toLowerCase();
  const hasSyncOnlyTerm = searchQuery.includes('sync only') || searchQuery.includes('sync-only') || searchQuery.includes('synconly');
  const hasVocalsTerm = searchQuery.includes('vocals') || searchQuery.includes('vocal') || searchQuery.includes('singing');
  
  // Check Sync Only (+8 for exact match when searching for sync only)
  if (hasSyncOnlyTerm && track.is_sync_only === true) {
    score += 8;
  }
  
  // Check Vocals (+8 for exact match when searching for vocals)
  if (hasVocalsTerm && track.has_vocals === true) {
    score += 8;
  }
  
  // Check genres (+5 for exact match, +3 for partial match)
  const trackGenres = parseArrayField(track.genres);
  trackGenres.forEach((genre: string) => {
    const genreLower = genre.toLowerCase();
    // Check for exact matches first
    if (expandedTerms.some(term => genreLower === term)) {
      score += 5;
    } else if (expandedTerms.some(term => genreLower.includes(term) || term.includes(genreLower))) {
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
  
  // Check media usage with enhanced sports detection
  const trackMediaUsage = parseArrayField(track.media_usage);
  const searchQueryLower = searchQuery.toLowerCase();
  const hasSportsTerm = searchQueryLower.includes('sports') || searchQueryLower.includes('sport') || 
                       searchQueryLower.includes('football') || searchQueryLower.includes('basketball') ||
                       searchQueryLower.includes('baseball') || searchQueryLower.includes('soccer') ||
                       searchQueryLower.includes('hockey') || searchQueryLower.includes('tennis') ||
                       searchQueryLower.includes('golf') || searchQueryLower.includes('racing') ||
                       searchQueryLower.includes('olympics') || searchQueryLower.includes('nfl') ||
                       searchQueryLower.includes('nba') || searchQueryLower.includes('mlb') ||
                       searchQueryLower.includes('nhl') || searchQueryLower.includes('ncaa');
  
  trackMediaUsage.forEach((mediaType: string) => {
    const mediaTypeLower = mediaType.toLowerCase();
    
    // If searching for sports, give higher score to sports-related media
    if (hasSportsTerm) {
      if (mediaTypeLower.includes('sports') || mediaTypeLower.includes('sport') ||
          mediaTypeLower.includes('football') || mediaTypeLower.includes('basketball') ||
          mediaTypeLower.includes('baseball') || mediaTypeLower.includes('soccer') ||
          mediaTypeLower.includes('hockey') || mediaTypeLower.includes('tennis') ||
          mediaTypeLower.includes('golf') || mediaTypeLower.includes('racing') ||
          mediaTypeLower.includes('olympics') || mediaTypeLower.includes('nfl') ||
          mediaTypeLower.includes('nba') || mediaTypeLower.includes('mlb') ||
          mediaTypeLower.includes('nhl') || mediaTypeLower.includes('ncaa')) {
        score += 5; // Higher score for sports-related media when searching for sports
      } else if (expandedTerms.some(term => mediaTypeLower.includes(term))) {
        score += 1; // Lower score for general matches
      }
    } else {
      // Regular media usage scoring
      if (expandedTerms.some(term => mediaTypeLower.includes(term))) {
        score += 1;
      }
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
          searchTerms.push(...filters.query.split(/\s+/).filter(Boolean));
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
          if (filters?.query) searchTerms.push(...filters.query.split(/\s+/).filter(Boolean));
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
       hasVocals: searchFilters.hasVocals
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
    
    tracks.forEach(track => {
      const score = track.searchScore || 0;
      
      // Enhanced thresholds for better categorization
      // For sports searches, require higher scores for exact matches
      const searchQuery = filters?.query?.toLowerCase() || '';
      const hasSportsTerm = searchQuery.includes('sports') || searchQuery.includes('sport') || 
                           searchQuery.includes('football') || searchQuery.includes('basketball') ||
                           searchQuery.includes('baseball') || searchQuery.includes('soccer') ||
                           searchQuery.includes('hockey') || searchQuery.includes('tennis') ||
                           searchQuery.includes('golf') || searchQuery.includes('racing') ||
                           searchQuery.includes('olympics') || searchQuery.includes('nfl') ||
                           searchQuery.includes('nba') || searchQuery.includes('mlb') ||
                           searchQuery.includes('nhl') || searchQuery.includes('ncaa');
      
      if (hasSportsTerm) {
        // Higher thresholds for sports searches to ensure quality matches
        if (score >= 15) {
          exactMatches.push(track);
        } else if (score >= 8) {
          partialMatches.push(track);
        } else {
          otherTracks.push(track);
        }
      } else {
        // Regular thresholds for non-sports searches
        if (score >= 10) {
          exactMatches.push(track);
        } else if (score >= 5) {
          partialMatches.push(track);
        } else {
          otherTracks.push(track);
        }
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
