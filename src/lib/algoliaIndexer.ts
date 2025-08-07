import { supabase } from './supabase';
import { indexTrack, updateTrackInIndex, removeTrackFromIndex } from './algolia';
import { parseArrayField } from './utils';

// Format track data for Algolia indexing
const formatTrackForAlgolia = (track: any) => {
  return {
    id: track.id,
    title: track.title || 'Untitled',
    artist: track.producer?.first_name || 
            track.producer?.email?.split('@')[0] || 
            'Unknown Artist',
    genres: parseArrayField(track.genres),
    sub_genres: parseArrayField(track.sub_genres),
    moods: parseArrayField(track.moods),
    bpm: track.bpm,
    duration: track.duration || '3:30',
    audio_url: track.audio_url,
    image_url: track.image_url,
    has_sting_ending: track.has_sting_ending || false,
    is_one_stop: track.is_one_stop || false,
    has_vocals: track.has_vocals || false,
    vocals_usage_type: track.vocals_usage_type,
    is_sync_only: track.is_sync_only || false,
    track_producer_id: track.track_producer_id,
    producer: track.producer ? {
      id: track.producer.id,
      firstName: track.producer.first_name || '',
      lastName: track.producer.last_name || '',
      email: track.producer.email || '',
      avatarPath: track.producer.avatar_path || '',
    } : undefined,
    mp3_url: track.mp3_url,
    trackouts_url: track.trackouts_url,
    stems_url: track.stems_url,
    created_at: track.created_at,
    // Add searchable text fields
    searchableText: [
      track.title,
      track.producer?.first_name,
      track.producer?.last_name,
      track.producer?.email?.split('@')[0],
      ...parseArrayField(track.genres),
      ...parseArrayField(track.sub_genres),
      ...parseArrayField(track.moods)
    ].filter(Boolean).join(' ')
  };
};

// Sync all tracks to Algolia
export const syncAllTracksToAlgolia = async () => {
  try {
    console.log('Starting full sync to Algolia...');
    
    const { data: tracks, error } = await supabase
      .from('tracks')
      .select(`
        id,
        title,
        genres,
        sub_genres,
        moods,
        bpm,
        duration,
        audio_url,
        image_url,
        has_sting_ending,
        is_one_stop,
        has_vocals,
        vocals_usage_type,
        is_sync_only,
        track_producer_id,
        mp3_url,
        trackouts_url,
        stems_url,
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

    if (error) throw error;

    console.log(`Found ${tracks.length} tracks to sync`);

    // Process tracks in batches to avoid rate limiting
    const batchSize = 100;
    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize);
      const formattedTracks = batch.map(formatTrackForAlgolia);
      
      // Use Algolia's batch operations
      const algoliaClient = (await import('./algolia')).tracksIndex;
      await algoliaClient.saveObjects(formattedTracks);
      
      console.log(`Synced batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tracks.length / batchSize)}`);
    }

    console.log('Full sync to Algolia completed successfully');
  } catch (error) {
    console.error('Error syncing tracks to Algolia:', error);
    throw error;
  }
};

// Sync a single track to Algolia
export const syncTrackToAlgolia = async (trackId: string) => {
  try {
    const { data: track, error } = await supabase
      .from('tracks')
      .select(`
        id,
        title,
        genres,
        sub_genres,
        moods,
        bpm,
        duration,
        audio_url,
        image_url,
        has_sting_ending,
        is_one_stop,
        has_vocals,
        vocals_usage_type,
        is_sync_only,
        track_producer_id,
        mp3_url,
        trackouts_url,
        stems_url,
        created_at,
        producer:profiles!track_producer_id (
          id,
          first_name,
          last_name,
          email,
          avatar_path
        )
      `)
      .eq('id', trackId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;

    const formattedTrack = formatTrackForAlgolia(track);
    await indexTrack(formattedTrack);
    
    console.log(`Track ${trackId} synced to Algolia`);
  } catch (error) {
    console.error(`Error syncing track ${trackId} to Algolia:`, error);
    throw error;
  }
};

// Update a track in Algolia
export const updateTrackInAlgolia = async (trackId: string) => {
  try {
    const { data: track, error } = await supabase
      .from('tracks')
      .select(`
        id,
        title,
        genres,
        sub_genres,
        moods,
        bpm,
        duration,
        audio_url,
        image_url,
        has_sting_ending,
        is_one_stop,
        has_vocals,
        vocals_usage_type,
        is_sync_only,
        track_producer_id,
        mp3_url,
        trackouts_url,
        stems_url,
        created_at,
        producer:profiles!track_producer_id (
          id,
          first_name,
          last_name,
          email,
          avatar_path
        )
      `)
      .eq('id', trackId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;

    const formattedTrack = formatTrackForAlgolia(track);
    await updateTrackInIndex(formattedTrack);
    
    console.log(`Track ${trackId} updated in Algolia`);
  } catch (error) {
    console.error(`Error updating track ${trackId} in Algolia:`, error);
    throw error;
  }
};

// Remove a track from Algolia
export const removeTrackFromAlgolia = async (trackId: string) => {
  try {
    await removeTrackFromIndex(trackId);
    console.log(`Track ${trackId} removed from Algolia`);
  } catch (error) {
    console.error(`Error removing track ${trackId} from Algolia:`, error);
    throw error;
  }
};

// Set up database triggers for automatic syncing
export const setupAlgoliaSyncTriggers = async () => {
  try {
    // This would typically be done via Supabase Edge Functions or database triggers
    // For now, we'll provide the SQL that can be run manually
    const triggerSQL = `
      -- Create function to sync track to Algolia
      CREATE OR REPLACE FUNCTION sync_track_to_algolia()
      RETURNS TRIGGER AS $$
      BEGIN
        -- This would call an Edge Function to sync to Algolia
        -- For now, we'll just log the change
        IF TG_OP = 'INSERT' THEN
          RAISE LOG 'Track % inserted - should sync to Algolia', NEW.id;
        ELSIF TG_OP = 'UPDATE' THEN
          RAISE LOG 'Track % updated - should sync to Algolia', NEW.id;
        ELSIF TG_OP = 'DELETE' THEN
          RAISE LOG 'Track % deleted - should remove from Algolia', OLD.id;
        END IF;
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;

      -- Create trigger for track changes
      DROP TRIGGER IF EXISTS tracks_algolia_sync_trigger ON tracks;
      CREATE TRIGGER tracks_algolia_sync_trigger
        AFTER INSERT OR UPDATE OR DELETE ON tracks
        FOR EACH ROW
        EXECUTE FUNCTION sync_track_to_algolia();
    `;

    console.log('Algolia sync triggers setup SQL:');
    console.log(triggerSQL);
    
    // Note: This SQL should be run manually in the Supabase dashboard
    // or via a migration file
  } catch (error) {
    console.error('Error setting up Algolia sync triggers:', error);
    throw error;
  }
};
