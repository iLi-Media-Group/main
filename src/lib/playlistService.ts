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
  // Create a new playlist
  static async createPlaylist(data: CreatePlaylistData): Promise<Playlist> {
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
        slug
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

  // Get all playlists for a producer
  static async getProducerPlaylists(): Promise<Playlist[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: playlists, error } = await supabase
      .from('playlists')
      .select(`
        *,
        producer:profiles!playlists_producer_id_fkey (
          id,
          first_name,
          last_name,
          email,
          avatar_path
        ),
        tracks_count:playlist_tracks(count)
      `)
      .eq('producer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return playlists || [];
  }

  // Get a single playlist with tracks
  static async getPlaylist(slug: string): Promise<PlaylistWithTracks | null> {
    const { data: playlist, error } = await supabase
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
      .eq('slug', slug)
      .eq('is_public', true)
      .single();

    if (error || !playlist) return null;

    // Get tracks for this playlist
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

    if (tracksError) throw tracksError;

    return {
      ...playlist,
      tracks: tracks || []
    };
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

    // Verify playlist belongs to user
    const { data: playlist } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', playlistId)
      .eq('producer_id', user.id)
      .single();

    if (!playlist) throw new Error('Playlist not found or access denied');

    // Get current max position
    const { data: maxPosition } = await supabase
      .from('playlist_tracks')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const newPosition = (maxPosition?.position || 0) + 1;

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

    if (error) throw error;
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
  static async getPlaylistAnalytics(playlistId: string): Promise<PlaylistAnalytics> {
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

    // Get total views
    const { count: totalViews } = await supabase
      .from('playlist_views')
      .select('*', { count: 'exact', head: true })
      .eq('playlist_id', playlistId);

    // Get unique views (by IP)
    const { count: uniqueViews } = await supabase
      .from('playlist_views')
      .select('viewer_ip', { count: 'exact', head: true })
      .eq('playlist_id', playlistId)
      .not('viewer_ip', 'is', null);

    // Get views by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: viewsByDate } = await supabase
      .from('playlist_views')
      .select('viewed_at')
      .eq('playlist_id', playlistId)
      .gte('viewed_at', thirtyDaysAgo.toISOString());

    // Group views by date
    const viewsByDateMap = new Map<string, number>();
    viewsByDate?.forEach(view => {
      const date = new Date(view.viewed_at).toISOString().split('T')[0];
      viewsByDateMap.set(date, (viewsByDateMap.get(date) || 0) + 1);
    });

    const viewsByDateArray = Array.from(viewsByDateMap.entries()).map(([date, count]) => ({
      date,
      count
    }));

    return {
      total_views: totalViews || 0,
      unique_views: uniqueViews || 0,
      views_by_date: viewsByDateArray,
      top_tracks: [] // TODO: Implement track play tracking
    };
  }

  // Generate unique slug
  private static async generateSlug(name: string, producerId: string): Promise<string> {
    const { data, error } = await supabase.rpc('generate_playlist_slug', {
      playlist_name: name,
      producer_id: producerId
    });

    if (error) throw error;
    return data;
  }
}
