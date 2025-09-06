import { supabase } from './supabase';

/**
 * Log a track play and increment the play count
 * @param trackId - The ID of the track that was played
 * @param userId - The ID of the user who played the track (optional)
 */
export async function logTrackPlay(trackId: string, userId?: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('log_track_play', {
      p_track_id: trackId,
      p_user_id: userId || null,
    });

    if (error) {
      console.error('Error logging track play:', error);
      // Don't throw the error to avoid breaking the user experience
      // The play count increment is not critical for the core functionality
    }
  } catch (err) {
    console.error('Error calling log_track_play RPC:', err);
    // Silently fail to avoid breaking the user experience
  }
}

/**
 * Get daily plays for a specific track
 * @param trackId - The ID of the track
 * @returns Array of daily play counts
 */
export async function getDailyPlaysForTrack(trackId: string) {
  try {
    const { data, error } = await supabase
      .from('track_plays')
      .select('played_at')
      .eq('track_id', trackId)
      .gte('played_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('played_at', { ascending: true });

    if (error) {
      console.error('Error fetching daily plays:', error);
      return [];
    }

    // Group by day and count plays
    const dailyPlays: { [key: string]: number } = {};
    data?.forEach(play => {
      const day = play.played_at.split('T')[0];
      dailyPlays[day] = (dailyPlays[day] || 0) + 1;
    });

    // Convert to array format
    return Object.entries(dailyPlays).map(([day, plays]) => ({
      day,
      plays
    }));
  } catch (err) {
    console.error('Error processing daily plays:', err);
    return [];
  }
}

/**
 * Get top tracks this month
 * @returns Array of top tracks with play counts
 */
export async function getTopTracksThisMonth() {
  try {
    // First try to get data from track_plays table if it exists
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('track_plays')
      .select(`
        track_id,
        tracks!inner(
          title,
          artist,
          producer:producer_id(
            first_name,
            last_name
          )
        )
      `)
      .gte('played_at', startOfMonth.toISOString());

    if (error) {
      console.log('track_plays table not available yet, using fallback:', error.message);
      // Fallback: get top tracks by play_count from tracks table
      return await getTopTracksFallback();
    }

    if (!data || data.length === 0) {
      console.log('No track_plays data yet, using fallback');
      return await getTopTracksFallback();
    }

    // Count plays per track
    const trackPlays: { [key: string]: { title: string; artist?: string; producer?: { firstName: string; lastName: string }; plays: number } } = {};
    data?.forEach(play => {
      const trackId = play.track_id;
      const track = (play.tracks as any);
      const title = track?.title || 'Unknown Track';
      const artist = track?.artist;
      const producer = track?.producer ? {
        firstName: track.producer.first_name,
        lastName: track.producer.last_name
      } : undefined;
      
      if (!trackPlays[trackId]) {
        trackPlays[trackId] = { title, artist, producer, plays: 0 };
      }
      trackPlays[trackId].plays++;
    });

    // Convert to array and sort by plays
    return Object.values(trackPlays)
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 10);
  } catch (err) {
    console.error('Error processing top tracks:', err);
    return await getTopTracksFallback();
  }
}

// Fallback function when track_plays table doesn't exist yet
async function getTopTracksFallback() {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .select(`
        id,
        title,
        artist,
        play_count,
        producer:producer_id(
          first_name,
          last_name
        )
      `)
      .order('play_count', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching fallback top tracks:', error);
      return [];
    }

    return data?.map(track => ({
      title: track.title,
      artist: track.artist,
      producer: track.producer ? {
        firstName: track.producer.first_name,
        lastName: track.producer.last_name
      } : undefined,
      plays: track.play_count || 0
    })) || [];
  } catch (err) {
    console.error('Error in fallback top tracks:', err);
    return [];
  }
}
