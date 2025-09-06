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
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('track_plays')
      .select(`
        track_id,
        tracks!inner(title)
      `)
      .gte('played_at', startOfMonth.toISOString());

    if (error) {
      console.error('Error fetching top tracks:', error);
      return [];
    }

    // Count plays per track
    const trackPlays: { [key: string]: { title: string; plays: number } } = {};
    data?.forEach(play => {
      const trackId = play.track_id;
      const title = (play.tracks as any)?.title || 'Unknown Track';
      
      if (!trackPlays[trackId]) {
        trackPlays[trackId] = { title, plays: 0 };
      }
      trackPlays[trackId].plays++;
    });

    // Convert to array and sort by plays
    return Object.values(trackPlays)
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 10);
  } catch (err) {
    console.error('Error processing top tracks:', err);
    return [];
  }
}
