import { supabase } from './supabase';
import { 
  Playlist, 
  PlaylistTrack, 
  PlaylistWithTracks, 
  CreatePlaylistData, 
  UpdatePlaylistData,
  PlaylistAnalytics 
} from '../types/playlist';

export class PlaylistService {
  // Create a new playlist for any account type
  static async createPlaylist(data: CreatePlaylistData, accountType: string = 'producer'): Promise<Playlist> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate slug from name
    const slug = await this.generateSlug(data.name, user.id);

    const { data: playlist, error } = await supabase
      .from('playlists')
      .insert({
        producer_id: user.id,
        name: data.name,
        description: data.description,
        company_name: data.company_name,
        logo_url: data.logo_url,
        photo_url: data.photo_url,
        is_public: data.is_public ?? true,
        slug,
        creator_type: accountType
      })
      .select(`
        *,
        producer:profiles!playlists_producer_id_fkey (
          id,
          first_name,
          last_name,
          email,
          avatar_path
        )
      `)
      .single();

    if (error) throw error;
    return playlist;
  }

  // Get all playlists for a producer (backward compatibility)
  static async getProducerPlaylists(): Promise<Playlist[]> {
    return this.getUserPlaylists('producer');
  }

  // Get all playlists for any account type
  static async getUserPlaylists(accountType?: string): Promise<Playlist[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('Fetching playlists for user:', user.id, 'account type:', accountType);

    let query = supabase
      .from('playlists')
      .select(`
        *,
        producer:profiles!playlists_producer_id_fkey (
          id,
          first_name,
          last_name,
          email,
          avatar_path
        )
      `)
      .eq('producer_id', user.id);

    // If account type is specified, filter by it
    if (accountType) {
      query = query.eq('creator_type', accountType);
    }

    const { data: playlists, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching playlists:', error);
      throw error;
    }

    // Get track counts separately to avoid complex joins
    const playlistsWithCounts = await Promise.all(
      (playlists || []).map(async (playlist) => {
        const { count } = await supabase
          .from('playlist_tracks')
          .select('*', { count: 'exact', head: true })
          .eq('playlist_id', playlist.id);
        
        return {
          ...playlist,
          tracks_count: count || 0
        };
      })
    );

    return playlistsWithCounts;
  }

  // Get playlists for clients
  static async getClientPlaylists(): Promise<Playlist[]> {
    return this.getUserPlaylists('client');
  }

  // Get playlists for artists
  static async getArtistPlaylists(): Promise<Playlist[]> {
    return this.getUserPlaylists('artist_band');
  }

  // Get playlists for record labels
  static async getRecordLabelPlaylists(): Promise<Playlist[]> {
    return this.getUserPlaylists('rights_holder');
  }

  // Get a single playlist with tracks
  static async getPlaylist(slug: string): Promise<PlaylistWithTracks | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    // First, try to get the playlist by slug without the foreign key join
    let { data: playlist, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !playlist) {
      return null;
    }

    // Check if user can access this playlist
    if (user) {
      // User is logged in - they can see their own playlists or public playlists
      const isOwner = playlist.producer_id === user.id;
      const isPublic = playlist.is_public;
      
      if (!isOwner && !isPublic) {
        return null;
      }
    } else {
      // User is not logged in - they can only see public playlists
      if (!playlist.is_public) {
        return null;
      }
    }

    // Get the creator's profile information separately
    console.log('👤 Fetching creator profile for ID:', playlist.producer_id);
    const { data: creator, error: creatorError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        avatar_path
      `)
      .eq('id', playlist.producer_id)
      .single();

    if (creatorError) {
      console.log('❌ Error fetching creator profile:', creatorError);
      // Continue without creator info rather than failing
    } else {
      console.log('✅ Creator profile fetched:', creator);
    }

    // Get tracks for this playlist
    console.log('🎵 Fetching tracks for playlist ID:', playlist.id);
    const { data: tracks, error: tracksError } = await supabase
      .from('playlist_tracks')
      .select(`
        *,
        track:tracks!playlist_tracks_track_id_fkey (
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
          producer:profiles!tracks_track_producer_id_fkey (
            id,
            first_name,
            last_name,
            email,
            avatar_path
          )
        )
      `)
      .eq('playlist_id', playlist.id)
      .order('position', { ascending: true });

    if (tracksError) {
      console.log('❌ Error fetching tracks:', tracksError);
      // Don't throw error, just continue with empty tracks array
      console.log('⚠️ Continuing with empty tracks array due to error');
    } else {
      console.log('✅ Tracks fetched:', tracks?.length || 0, 'tracks');
    }

    const result = {
      ...playlist,
      producer: creator, // Add the creator profile info
      tracks: tracks || []
    };
    
    console.log('✅ PlaylistService.getPlaylist returning result:', {
      id: result.id,
      name: result.name,
      slug: result.slug,
      tracks_count: result.tracks.length,
      has_producer: !!result.producer
    });
    
    return result;
  }

  // Update a playlist
  static async updatePlaylist(playlistId: string, data: UpdatePlaylistData): Promise<Playlist> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: playlist, error } = await supabase
      .from('playlists')
      .update(data)
      .eq('id', playlistId)
      .eq('producer_id', user.id)
      .select(`
        *,
        producer:profiles!playlists_producer_id_fkey (
          id,
          first_name,
          last_name,
          email,
          avatar_path
        )
      `)
      .single();

    if (error) throw error;
    return playlist;
  }

  // Delete a playlist
  static async deletePlaylist(playlistId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId)
      .eq('producer_id', user.id);

    if (error) throw error;
  }

  // Add a track to a playlist
  static async addTrackToPlaylist(playlistId: string, trackId: string): Promise<PlaylistTrack> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('Adding track to playlist:', { playlistId, trackId, userId: user.id });

    // Verify playlist belongs to user
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', playlistId)
      .eq('producer_id', user.id)
      .single();

    if (playlistError) {
      console.error('Error verifying playlist ownership:', playlistError);
      throw new Error('Playlist not found or access denied');
    }

    if (!playlist) throw new Error('Playlist not found or access denied');

    // Get current max position
    const { data: maxPosition, error: positionError } = await supabase
      .from('playlist_tracks')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    if (positionError && positionError.code !== 'PGRST116') {
      console.error('Error getting max position:', positionError);
      throw positionError;
    }

    const newPosition = (maxPosition?.position || 0) + 1;

    console.log('Inserting playlist track with position:', newPosition);

    const { data: playlistTrack, error } = await supabase
      .from('playlist_tracks')
      .insert({
        playlist_id: playlistId,
        track_id: trackId,
        position: newPosition
      })
      .select(`
        *,
        track:tracks!playlist_tracks_track_id_fkey (
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
          producer:profiles!tracks_track_producer_id_fkey (
            id,
            first_name,
            last_name,
            email,
            avatar_path
          )
        )
      `)
      .single();

    if (error) {
      console.error('Error adding track to playlist:', error);
      throw error;
    }
    
    return playlistTrack;
  }

  // Remove a track from a playlist
  static async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Verify playlist belongs to user
    const { data: playlist } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', playlistId)
      .eq('producer_id', user.id)
      .single();

    if (!playlist) throw new Error('Playlist not found or access denied');

    const { error } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('track_id', trackId);

    if (error) throw error;
  }

  // Reorder tracks in a playlist
  static async reorderPlaylistTracks(playlistId: string, trackIds: string[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Verify playlist belongs to user
    const { data: playlist } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', playlistId)
      .eq('producer_id', user.id)
      .single();

    if (!playlist) throw new Error('Playlist not found or access denied');

    // Update positions for each track
    for (let i = 0; i < trackIds.length; i++) {
      const { error } = await supabase
        .from('playlist_tracks')
        .update({ position: i + 1 })
        .eq('playlist_id', playlistId)
        .eq('track_id', trackIds[i]);

      if (error) throw error;
    }
  }

  // Get producer's tracks for dropdown
  static async getProducerTracks(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: tracks, error } = await supabase
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
        producer:profiles!tracks_track_producer_id_fkey (
          id,
          first_name,
          last_name,
          email,
          avatar_path
        )
      `)
      .eq('track_producer_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return tracks || [];
  }

  // Record a playlist view
  static async recordPlaylistView(playlistId: string): Promise<void> {
    const { error } = await supabase
      .from('playlist_views')
      .insert({
        playlist_id: playlistId
      });

    if (error) console.error('Failed to record playlist view:', error);
  }

  // Get playlist analytics
  static async getPlaylistAnalytics(playlistId: string, timeRange: '7d' | '30d' | '90d' = '30d'): Promise<PlaylistAnalytics | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Verify playlist belongs to user
      const { data: playlist } = await supabase
        .from('playlists')
        .select('id')
        .eq('id', playlistId)
        .eq('producer_id', user.id)
        .single();

      if (!playlist) throw new Error('Playlist not found or access denied');

      // Calculate days for the time range
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

      // Use the database function for analytics
      const { data: analyticsData, error } = await supabase.rpc('get_playlist_analytics', {
        p_playlist_id: playlistId,
        p_days: days
      });

      if (error) {
        console.error('Error calling analytics function:', error);
        // Fallback to basic analytics
        return this.getBasicAnalytics(playlistId, timeRange);
      }

      if (!analyticsData || analyticsData.length === 0) {
        return this.getBasicAnalytics(playlistId, timeRange);
      }

      const data = analyticsData[0];
      
      return {
        totalViews: Number(data.total_views) || 0,
        uniqueVisitors: Number(data.unique_visitors) || 0,
        totalTrackPlays: Number(data.total_track_plays) || 0,
        averageTimeOnPage: Number(data.avg_time_on_page) || 0,
        viewsByDay: data.views_by_day || [],
        trackPlays: data.track_plays || [],
        viewsByHour: data.views_by_hour || [],
        topReferrers: data.top_referrers || [],
        deviceTypes: data.device_types || [],
        countries: data.countries || []
      };
    } catch (error) {
      console.error('Error fetching playlist analytics:', error);
      return this.getBasicAnalytics(playlistId, timeRange);
    }
  }

  // Fallback basic analytics method
  private static async getBasicAnalytics(playlistId: string, timeRange: '7d' | '30d' | '90d'): Promise<PlaylistAnalytics> {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: viewsData } = await supabase
      .from('playlist_views')
      .select('*')
      .eq('playlist_id', playlistId)
      .gte('viewed_at', startDate.toISOString());

    const { data: playlistTracks } = await supabase
      .from('playlist_tracks')
      .select(`
        id,
        track_id,
        tracks (
          id,
          title,
          audio_url
        )
      `)
      .eq('playlist_id', playlistId);

    return this.processAnalyticsData(viewsData || [], playlistTracks || [], timeRange);
  }

  // Process analytics data
  private static processAnalyticsData(viewsData: any[], playlistTracks: any[], timeRange: string): PlaylistAnalytics {
    const totalViews = viewsData.length;
    const uniqueVisitors = new Set(viewsData.map(v => v.viewer_ip).filter(Boolean)).size;
    
    // Calculate average time on page (mock data for now)
    const averageTimeOnPage = 4.5; // minutes

    // Group views by day
    const viewsByDayMap = new Map<string, number>();
    viewsData.forEach(view => {
      const date = new Date(view.viewed_at).toISOString().split('T')[0];
      viewsByDayMap.set(date, (viewsByDayMap.get(date) || 0) + 1);
    });

    const viewsByDay = Array.from(viewsByDayMap.entries())
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group views by hour
    const viewsByHourMap = new Map<string, number>();
    viewsData.forEach(view => {
      const hour = new Date(view.viewed_at).getHours().toString();
      viewsByHourMap.set(hour, (viewsByHourMap.get(hour) || 0) + 1);
    });

    const viewsByHour = Array.from({ length: 24 }, (_, i) => ({
      hour: i.toString(),
      views: viewsByHourMap.get(i.toString()) || 0
    }));

    // Mock track plays data (in real implementation, this would come from track play events)
    const trackPlays = playlistTracks.map(pt => ({
      trackTitle: pt.tracks?.title || 'Unknown Track',
      plays: Math.floor(Math.random() * 50) + 1 // Mock data
    }));

    // Mock referrer data
    const topReferrers = [
      { source: 'Direct', views: Math.floor(Math.random() * 100) + 50 },
      { source: 'Google', views: Math.floor(Math.random() * 80) + 30 },
      { source: 'Social Media', views: Math.floor(Math.random() * 60) + 20 },
      { source: 'Email', views: Math.floor(Math.random() * 40) + 10 }
    ];

    // Mock device types
    const deviceTypes = [
      { device: 'Desktop', views: Math.floor(Math.random() * 200) + 100 },
      { device: 'Mobile', views: Math.floor(Math.random() * 150) + 80 },
      { device: 'Tablet', views: Math.floor(Math.random() * 50) + 20 }
    ];

    // Mock countries
    const countries = [
      { country: 'United States', views: Math.floor(Math.random() * 300) + 150 },
      { country: 'Canada', views: Math.floor(Math.random() * 100) + 50 },
      { country: 'United Kingdom', views: Math.floor(Math.random() * 80) + 40 },
      { country: 'Australia', views: Math.floor(Math.random() * 60) + 30 }
    ];

    return {
      totalViews,
      uniqueVisitors,
      totalTrackPlays: trackPlays.reduce((sum, tp) => sum + tp.plays, 0),
      averageTimeOnPage,
      viewsByDay,
      trackPlays,
      viewsByHour,
      topReferrers,
      deviceTypes,
      countries
    };
  }

  // Generate unique slug
  private static async generateSlug(name: string, producerId: string): Promise<string> {
    try {
      // Get producer name first
      const { data: producer, error: producerError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', producerId)
        .single();

      if (producerError) {
        console.error('Error fetching producer data:', producerError);
        throw new Error('Failed to fetch producer data');
      }

      // Generate producer slug from name
      const producerName = producer.first_name && producer.last_name 
        ? `${producer.first_name} ${producer.last_name}`
        : producer.first_name 
        ? producer.first_name 
        : producer.email.split('@')[0];

      const producerSlug = producerName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();

      // Generate playlist slug
      const playlistSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();

      const baseSlug = `${producerSlug}/${playlistSlug}`;
      const finalSlug = baseSlug || `${producerSlug}/playlist`;
      
      // Check if slug already exists and append number if needed
      let counter = 0;
      let uniqueSlug = finalSlug;
      
      while (true) {
        const { data: existingPlaylist } = await supabase
          .from('playlists')
          .select('id')
          .eq('slug', uniqueSlug)
          .eq('producer_id', producerId)
          .single();
        
        if (!existingPlaylist) {
          break;
        }
        
        counter++;
        uniqueSlug = `${finalSlug}-${counter}`;
      }
      
      return uniqueSlug;
    } catch (error) {
      console.error('Error generating slug:', error);
      // Fallback to simple slug generation
      const baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();

      const finalSlug = baseSlug || 'playlist';
      
      // Check if slug already exists and append number if needed
      let counter = 0;
      let uniqueSlug = finalSlug;
      
      while (true) {
        const { data: existingPlaylist } = await supabase
          .from('playlists')
          .select('id')
          .eq('slug', uniqueSlug)
          .eq('producer_id', producerId)
          .single();
        
        if (!existingPlaylist) {
          break;
        }
        
        counter++;
        uniqueSlug = `${finalSlug}-${counter}`;
      }
      
      return uniqueSlug;
    }
  }

  // Get user's favorited playlists
  static async getFavoritedPlaylists(limit: number = 10): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase.rpc('get_user_favorited_playlists', {
        p_limit: limit
      });

      if (error) {
        // If the RPC function doesn't exist yet, return empty array
        if (error.message.includes('404') || error.message.includes('function') || error.message.includes('not found')) {
          console.warn('Playlist favorites RPC function not found, returning empty array');
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (err) {
      // Handle any other errors gracefully
      console.warn('Error fetching favorited playlists:', err);
      return [];
    }
  }

  // Toggle playlist favorite status
  static async toggleFavorite(playlistId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase.rpc('toggle_playlist_favorite', {
        p_playlist_id: playlistId
      });

      if (error) {
        // If the RPC function doesn't exist yet, use direct table operations
        if (error.message.includes('404') || error.message.includes('function') || error.message.includes('not found')) {
          console.warn('Playlist favorites RPC function not found, using direct table operations');
          return await this.toggleFavoriteDirect(playlistId);
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.warn('Error toggling playlist favorite:', err);
      return await this.toggleFavoriteDirect(playlistId);
    }
  }

  // Fallback method for toggling favorites using direct table operations
  private static async toggleFavoriteDirect(playlistId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if already favorited
    const { data: existing } = await supabase
      .from('playlist_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('playlist_id', playlistId)
      .single();

    if (existing) {
      // Remove from favorites
      const { error } = await supabase
        .from('playlist_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('playlist_id', playlistId);
      
      if (error) throw error;
      return false;
    } else {
      // Add to favorites
      const { error } = await supabase
        .from('playlist_favorites')
        .insert({
          user_id: user.id,
          playlist_id: playlistId
        });
      
      if (error) throw error;
      return true;
    }
  }

  // Check if a playlist is favorited by the current user
  static async isFavorited(playlistId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('playlist_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('playlist_id', playlistId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  // Check if a playlist is favorited by any clients
  static async getPlaylistFavoriteCount(playlistId: string): Promise<number> {
    const { data, error } = await supabase
      .from('playlist_favorites')
      .select('id', { count: 'exact', head: true })
      .eq('playlist_id', playlistId);

    if (error) {
      console.error('Error getting playlist favorite count:', error);
      return 0;
    }

    return data?.length || 0;
  }

  // Get all playlists with their favorite counts for a producer
  static async getProducerPlaylistsWithFavorites(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: playlists, error: playlistError } = await supabase
      .from('playlists')
      .select(`
        *,
        producer:profiles!playlists_producer_id_fkey(first_name, last_name, email)
      `)
      .eq('producer_id', user.id)
      .order('created_at', { ascending: false });

    if (playlistError) throw playlistError;

    // Get favorite counts for each playlist
    const playlistsWithFavorites = await Promise.all(
      playlists.map(async (playlist) => {
        const favoriteCount = await this.getPlaylistFavoriteCount(playlist.id);
        return {
          ...playlist,
          favorite_count: favoriteCount
        };
      })
    );

    return playlistsWithFavorites;
  }
}
