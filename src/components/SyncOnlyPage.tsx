import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Tag, Clock, Hash, FileMusic, Layers, Mic, Star, Play, User, ListMusic, Search, Filter, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Track } from '../types';
import { parseArrayField } from '../lib/utils';
import { TrackCard } from './TrackCard';
import { SearchBox } from './SearchBox';

const TRACKS_PER_PAGE = 20;

export function SyncOnlyPage() {
  const { user, membershipPlan, accountType } = useAuth();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [currentFilters, setCurrentFilters] = useState<any>(null);
  const [membershipActive, setMembershipActive] = useState(false);

  useEffect(() => {
    if (user && accountType === 'client') {
      checkMembershipStatus();
    }
    fetchTracks();
  }, [user, accountType]);

  const checkMembershipStatus = async () => {
    if (!user || accountType !== 'client') return;

    try {
      const { data: membership } = await supabase
        .from('user_memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .single();

      setMembershipActive(!!membership);
    } catch (error) {
      console.error('Error checking membership status:', error);
      setMembershipActive(false);
    }
  };

  const fetchTracks = async (filters?: any, currentPage: number = 1) => {
    try {
      setLoading(currentPage === 1);
      setLoadingMore(currentPage > 1);

      let query = supabase
        .from('tracks')
        .select(`
          *,
          track_producer_id:profiles!track_producer_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('is_sync_only', true)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * TRACKS_PER_PAGE, currentPage * TRACKS_PER_PAGE - 1);

      // Apply search filters
      if (filters) {
        // Apply BPM filters first (these are always applied)
        if (filters.minBpm) {
          query = query.gte('bpm', filters.minBpm);
        }
        if (filters.maxBpm) {
          query = query.lte('bpm', filters.maxBpm);
        }

        // Priority 1: Genre filtering (highest priority)
        if (filters.genres?.length > 0) {
          // Create genre conditions - tracks must match at least one of the selected genres
          const genreConditions = filters.genres.map((genre: string) => 
            `genres.ilike.%${genre}%`
          );
          
          // Apply genre filter with OR condition
          query = query.or(genreConditions.join(','));
          
          // Priority 2: Subgenre filtering (only if genres are selected)
          if (filters.subGenres?.length > 0) {
            const subGenreConditions = filters.subGenres.map((subGenre: string) => 
              `sub_genres.ilike.%${subGenre}%`
            );
            // Apply subgenre filter with OR condition
            query = query.or(subGenreConditions.join(','));
          }
          
          // Priority 3: Mood filtering (only if genres are selected)
          if (filters.moods?.length > 0) {
            const moodConditions = filters.moods.map((mood: string) => 
              `moods.ilike.%${mood}%`
            );
            // Apply mood filter with OR condition
            query = query.or(moodConditions.join(','));
          }
        } else {
          // No genres selected - allow mood-based search only
          if (filters.moods?.length > 0) {
            const moodConditions = filters.moods.map((mood: string) => 
              `moods.ilike.%${mood}%`
            );
            // Apply mood filter with OR condition
            query = query.or(moodConditions.join(','));
          }
          
          // Also allow subgenre search when no genres are selected
          if (filters.subGenres?.length > 0) {
            const subGenreConditions = filters.subGenres.map((subGenre: string) => 
              `sub_genres.ilike.%${subGenre}%`
            );
            // Apply subgenre filter with OR condition
            query = query.or(subGenreConditions.join(','));
          }
        }

        // Text search in title and artist
        if (filters.query) {
          const textConditions = [
            `title.ilike.%${filters.query}%`,
            `artist.ilike.%${filters.query}%`
          ];
          query = query.or(textConditions.join(','));
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const formattedTracks = data
          .filter(track => track && track.id)
          .map(track => ({
            id: track.id,
            title: track.title || 'Untitled',
            artist:
              track.track_producer_id?.first_name ||
              track.track_producer_id?.email?.split('@')[0] ||
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
            hasVocals: track.has_vocals || false,
            isSyncOnly: track.is_sync_only || false,
            producerId: track.track_producer_id || '',
            producer: track.track_producer_id?.[0] ? {
              id: track.track_producer_id[0].id,
              firstName: track.track_producer_id[0].first_name || '',
              lastName: track.track_producer_id[0].last_name || '',
              email: track.track_producer_id[0].email
            } : undefined,
            fileFormats: {
              stereoMp3: { format: ['MP3'], url: track.mp3_url || '' },
              trackouts: { format: ['WAV'], url: track.trackouts_url || '' },
              stems: { format: ['WAV'], url: track.stems_url || '' },
              stemsWithVocals: { format: ['WAV'], url: track.stems_url || '' }
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
    // Convert all search terms to lowercase and remove extra spaces
    const normalizedFilters = {
      ...filters,
      query: filters.query?.toLowerCase().trim(),
      genres: filters.genres?.map((g: string) => g.toLowerCase().trim()),
      moods: filters.moods?.map((m: string) => m.toLowerCase().trim())
    };

    // Update URL with search params
    const params = new URLSearchParams();
    if (normalizedFilters.query) params.set('q', normalizedFilters.query);
    if (normalizedFilters.genres?.length) params.set('genres', normalizedFilters.genres.join(','));
    if (normalizedFilters.moods?.length) params.set('moods', normalizedFilters.moods.join(','));
    if (normalizedFilters.minBpm) params.set('minBpm', normalizedFilters.minBpm.toString());
    if (normalizedFilters.maxBpm) params.set('maxBpm', normalizedFilters.maxBpm.toString());

    // Update URL without reloading the page
    navigate(`/sync-only?${params.toString()}`, { replace: true });
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
        <h1 className="text-3xl font-bold text-white mb-6">Sync Only Tracks</h1>
        <p className="text-gray-300 mb-6">
          These tracks are exclusively available for sync licensing through our proposal system.
        </p>
        <SearchBox onSearch={handleSearch} />
      </div>

      {!user && (
        <div className="mb-8 p-6 glass-card rounded-lg text-center">
          <p className="text-xl text-white mb-6">
            Preview our sync-only catalog below. Sign up or login to access our complete library and start licensing tracks.
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
          <p className="text-gray-400 text-lg">No sync-only tracks found matching your search criteria.</p>
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