import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Track, RelatedTrack } from '../types';
import { Link, X, Plus, Music } from 'lucide-react';

interface RelatedTracksManagerProps {
  currentTrackId?: string; // Optional for new tracks
  userId: string;
  onRelatedTracksChange: (relatedTracks: RelatedTrack[]) => void;
  className?: string;
}

export function RelatedTracksManager({ 
  currentTrackId, 
  userId, 
  onRelatedTracksChange,
  className = ''
}: RelatedTracksManagerProps) {
  const [availableTracks, setAvailableTracks] = useState<Track[]>([]);
  const [relatedTracks, setRelatedTracks] = useState<RelatedTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [selectedRelationshipType, setSelectedRelationshipType] = useState<string>('related');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load available tracks (excluding current track)
  useEffect(() => {
    loadAvailableTracks();
  }, [userId, currentTrackId]);

  // Load existing related tracks (only if track exists)
  useEffect(() => {
    if (currentTrackId) {
      loadRelatedTracks();
    }
  }, [currentTrackId]);

  const loadAvailableTracks = async () => {
    try {
      let query = supabase
        .from('tracks')
        .select(`
          id,
          title,
          artist,
          duration,
          bpm,
          key,
          genres,
          moods,
          has_vocals,
          is_sync_only,
          explicit_lyrics
        `)
        .eq('track_producer_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Exclude current track if it exists
      if (currentTrackId) {
        query = query.neq('id', currentTrackId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAvailableTracks(data || []);
    } catch (error) {
      console.error('Error loading available tracks:', error);
    }
  };

  const loadRelatedTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('related_tracks')
        .select(`
          id,
          track_id,
          related_track_id,
          relationship_type,
          created_at,
          related_track:tracks!related_tracks_related_track_id_fkey (
            id,
            title,
            artist,
            duration,
            bpm,
            key,
            genres,
            moods,
            has_vocals,
            is_sync_only,
            explicit_lyrics
          )
        `)
        .eq('track_id', currentTrackId);

      if (error) throw error;
      
      const formattedRelatedTracks = (data || []).map(item => ({
        id: item.id,
        trackId: item.track_id,
        relatedTrackId: item.related_track_id,
        relationshipType: item.relationship_type,
        relatedTrack: item.related_track,
        createdAt: item.created_at
      }));
      
      setRelatedTracks(formattedRelatedTracks);
      onRelatedTracksChange(formattedRelatedTracks);
    } catch (error) {
      console.error('Error loading related tracks:', error);
    }
  };

  const addRelatedTrack = async () => {
    if (!selectedTrackId || !selectedRelationshipType) return;

    try {
      setLoading(true);

      // Check if relationship already exists
      const existingRelation = relatedTracks.find(
        rt => rt.relatedTrackId === selectedTrackId
      );
      
      if (existingRelation) {
        alert('This track is already related to the current track.');
        return;
      }

      // If track doesn't exist yet (during upload), just add to local state
      if (!currentTrackId) {
        const selectedTrack = availableTracks.find(t => t.id === selectedTrackId);
        if (!selectedTrack) {
          throw new Error('Selected track not found');
        }

        const newRelatedTrack = {
          id: `temp-${Date.now()}`, // Temporary ID
          trackId: '', // Will be set when track is created
          relatedTrackId: selectedTrackId,
          relationshipType: selectedRelationshipType,
          relatedTrack: selectedTrack,
          createdAt: new Date().toISOString()
        };

        const updatedRelatedTracks = [...relatedTracks, newRelatedTrack];
        setRelatedTracks(updatedRelatedTracks);
        onRelatedTracksChange(updatedRelatedTracks);

        // Reset form
        setSelectedTrackId('');
        setSelectedRelationshipType('related');
        return;
      }

      // If track exists, save to database
      const { data, error } = await supabase
        .from('related_tracks')
        .insert({
          track_id: currentTrackId,
          related_track_id: selectedTrackId,
          relationship_type: selectedRelationshipType
        })
        .select(`
          id,
          track_id,
          related_track_id,
          relationship_type,
          created_at,
          related_track:tracks!related_tracks_related_track_id_fkey (
            id,
            title,
            artist,
            duration,
            bpm,
            key,
            genres,
            moods,
            has_vocals,
            is_sync_only,
            explicit_lyrics
          )
        `)
        .single();

      if (error) throw error;

      const newRelatedTrack = {
        id: data.id,
        trackId: data.track_id,
        relatedTrackId: data.related_track_id,
        relationshipType: data.relationship_type,
        relatedTrack: data.related_track,
        createdAt: data.created_at
      };

      const updatedRelatedTracks = [...relatedTracks, newRelatedTrack];
      setRelatedTracks(updatedRelatedTracks);
      onRelatedTracksChange(updatedRelatedTracks);

      // Reset form
      setSelectedTrackId('');
      setSelectedRelationshipType('related');
    } catch (error) {
      console.error('Error adding related track:', error);
      alert('Failed to add related track. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeRelatedTrack = async (relatedTrackId: string) => {
    try {
      setLoading(true);

      // If it's a temporary track (during upload), just remove from local state
      if (relatedTrackId.startsWith('temp-')) {
        const updatedRelatedTracks = relatedTracks.filter(rt => rt.id !== relatedTrackId);
        setRelatedTracks(updatedRelatedTracks);
        onRelatedTracksChange(updatedRelatedTracks);
        return;
      }

      // If track exists in database, delete it
      const { error } = await supabase
        .from('related_tracks')
        .delete()
        .eq('id', relatedTrackId);

      if (error) throw error;

      const updatedRelatedTracks = relatedTracks.filter(rt => rt.id !== relatedTrackId);
      setRelatedTracks(updatedRelatedTracks);
      onRelatedTracksChange(updatedRelatedTracks);
    } catch (error) {
      console.error('Error removing related track:', error);
      alert('Failed to remove related track. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRelationshipTypeLabel = (type: string) => {
    const labels = {
      'related': 'Related',
      'radio_version': 'Radio Version',
      'instrumental': 'Instrumental',
      'vocal_version': 'Vocal Version',
      'chorus_only': 'Chorus Only',
      'clean_version': 'Clean Version',
      'explicit_version': 'Explicit Version'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const filteredTracks = availableTracks.filter(track =>
    track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Music className="w-5 h-5 text-blue-400" />
        <h4 className="text-lg font-semibold text-white">Related Tracks</h4>
      </div>

      {/* Add Related Track Form */}
      <div className="bg-white/5 rounded-lg p-4 border border-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Track Search */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Related Track
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search your tracks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
              {searchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg max-h-48 overflow-y-auto">
                  {filteredTracks.map(track => (
                    <button
                      key={track.id}
                      onClick={() => {
                        setSelectedTrackId(track.id);
                        setSearchTerm(track.title);
                      }}
                      className="w-full px-3 py-2 text-left text-white hover:bg-gray-700 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{track.title}</div>
                        <div className="text-sm text-gray-400">{track.artist}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {track.duration} • {track.bpm} BPM
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Relationship Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Relationship Type
            </label>
            <select
              value={selectedRelationshipType}
              onChange={(e) => setSelectedRelationshipType(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="related">Related</option>
              <option value="radio_version">Radio Version</option>
              <option value="instrumental">Instrumental</option>
              <option value="vocal_version">Vocal Version</option>
              <option value="chorus_only">Chorus Only</option>
              <option value="clean_version">Clean Version</option>
              <option value="explicit_version">Explicit Version</option>
            </select>
          </div>

          {/* Add Button */}
          <div className="flex items-end">
            <button
              onClick={addRelatedTrack}
              disabled={!selectedTrackId || loading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Related Track
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Related Tracks List */}
      {relatedTracks.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-300">Current Related Tracks:</h5>
          <div className="space-y-2">
            {relatedTracks.map((relatedTrack) => (
              <div
                key={relatedTrack.id}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-600"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link className="w-4 h-4 text-blue-400" />
                    <a
                      href={`/track/${relatedTrack.relatedTrack?.id}`}
                      className="text-white font-medium hover:text-blue-400 transition-colors"
                    >
                      {relatedTrack.relatedTrack?.title}
                    </a>
                    <span className="text-gray-400">by {relatedTrack.relatedTrack?.artist}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                      {getRelationshipTypeLabel(relatedTrack.relationshipType)}
                    </span>
                    <span>{relatedTrack.relatedTrack?.duration}</span>
                    <span>{relatedTrack.relatedTrack?.bpm} BPM</span>
                    {relatedTrack.relatedTrack?.key && (
                      <span>Key: {relatedTrack.relatedTrack.key}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeRelatedTrack(relatedTrack.id)}
                  disabled={loading}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  title="Remove related track"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {relatedTracks.length === 0 && (
        <div className="text-center py-6 text-gray-400">
          <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No related tracks added yet.</p>
          <p className="text-sm">Use the form above to link this track to other tracks in your catalog.</p>
        </div>
      )}
    </div>
  );
}
