import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculateAudioDuration, getAudioMetadata } from '../utils/audioUtils';
import { useSignedUrl } from '../hooks/useSignedUrl';
import { Clock, RefreshCw, CheckCircle, AlertCircle, Play, Pause } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  audioUrl: string;
  duration: string;
}

interface TrackDurationUpdaterProps {
  trackId?: string; // Optional: update specific track
  onComplete?: () => void;
}

export function TrackDurationUpdater({ trackId, onComplete }: TrackDurationUpdaterProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<string>('');
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    skipped: number;
    errors: string[];
  }>({
    success: 0,
    failed: 0,
    skipped: 0,
    errors: []
  });

  // Fetch tracks that need duration updates
  const fetchTracks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tracks')
        .select('id, title, audio_url, duration')
        .not('audio_url', 'is', null)
        .not('audio_url', 'eq', '');

      if (trackId) {
        query = query.eq('id', trackId);
      } else {
        // Get tracks with missing or default duration
        query = query.or('duration.is.null,duration.eq.3:30,duration.eq.0:00');
      }

      const { data, error } = await query;

      if (error) throw error;

      const tracksWithUrls = data?.map(track => ({
        id: track.id,
        title: track.title,
        audioUrl: track.audio_url,
        duration: track.duration || '3:30'
      })) || [];

      setTracks(tracksWithUrls);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update track duration in database
  const updateTrackDuration = async (trackId: string, newDuration: string) => {
    const { error } = await supabase
      .from('tracks')
      .update({ duration: newDuration })
      .eq('id', trackId);

    if (error) {
      throw error;
    }
  };

  // Process all tracks
  const updateAllDurations = async () => {
    if (tracks.length === 0) return;

    setUpdating(true);
    setProgress(0);
    setResults({ success: 0, failed: 0, skipped: 0, errors: [] });

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      setCurrentTrack(track.title);
      setProgress(((i + 1) / tracks.length) * 100);

      try {
        // Skip if duration is already correct (not 3:30 or 0:00)
        if (track.duration && track.duration !== '3:30' && track.duration !== '0:00') {
          setResults(prev => ({ ...prev, skipped: prev.skipped + 1 }));
          continue;
        }

        // Calculate duration from audio file
        const newDuration = await calculateAudioDuration(track.audioUrl);
        
        // Update database
        await updateTrackDuration(track.id, newDuration);
        
        setResults(prev => ({ ...prev, success: prev.success + 1 }));
        
        // Update local state
        setTracks(prev => prev.map(t => 
          t.id === track.id ? { ...t, duration: newDuration } : t
        ));

      } catch (error) {
        console.error(`Error updating track ${track.title}:`, error);
        setResults(prev => ({
          ...prev,
          failed: prev.failed + 1,
          errors: [...prev.errors, `${track.title}: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }));
      }

      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setUpdating(false);
    setCurrentTrack('');
    if (onComplete) onComplete();
  };

  // Update single track duration
  const updateSingleTrackDuration = async (track: Track) => {
    try {
      setCurrentTrack(track.title);
      
      const newDuration = await calculateAudioDuration(track.audioUrl);
      await updateTrackDuration(track.id, newDuration);
      
      setTracks(prev => prev.map(t => 
        t.id === track.id ? { ...t, duration: newDuration } : t
      ));
      
      setResults(prev => ({ ...prev, success: prev.success + 1 }));
      
    } catch (error) {
      console.error(`Error updating track ${track.title}:`, error);
      setResults(prev => ({
        ...prev,
        failed: prev.failed + 1,
        errors: [...prev.errors, `${track.title}: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }));
    } finally {
      setCurrentTrack('');
    }
  };

  useEffect(() => {
    fetchTracks();
  }, [trackId]);

  if (loading) {
    return (
      <div className="p-6 bg-blue-950/80 border border-blue-500/40 rounded-xl">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-blue-200">Loading tracks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">
            Track Duration Updater
          </h3>
        </div>
        <div className="text-sm text-gray-400">
          {tracks.length} tracks found
        </div>
      </div>

      {/* Progress Bar */}
      {updating && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-200">Updating durations...</span>
            <span className="text-gray-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {currentTrack && (
            <div className="text-sm text-gray-400">
              Processing: {currentTrack}
            </div>
          )}
        </div>
      )}

      {/* Results Summary */}
      {(results.success > 0 || results.failed > 0 || results.skipped > 0) && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-900/80 border border-green-500/40 rounded-lg p-3 text-center">
            <div className="text-green-400 font-semibold">{results.success}</div>
            <div className="text-green-300 text-sm">Updated</div>
          </div>
          <div className="bg-red-900/80 border border-red-500/40 rounded-lg p-3 text-center">
            <div className="text-red-400 font-semibold">{results.failed}</div>
            <div className="text-red-300 text-sm">Failed</div>
          </div>
          <div className="bg-yellow-900/80 border border-yellow-500/40 rounded-lg p-3 text-center">
            <div className="text-yellow-400 font-semibold">{results.skipped}</div>
            <div className="text-yellow-300 text-sm">Skipped</div>
          </div>
        </div>
      )}

      {/* Error List */}
      {results.errors.length > 0 && (
        <div className="bg-red-900/80 border border-red-500/40 rounded-lg p-4">
          <h4 className="text-red-400 font-semibold mb-2">Errors:</h4>
          <ul className="text-red-300 text-sm space-y-1">
            {results.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={updateAllDurations}
          disabled={updating || tracks.length === 0}
          className="btn-primary flex items-center gap-2"
        >
          {updating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              Updating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Update All Durations
            </>
          )}
        </button>
        
        <button
          onClick={fetchTracks}
          disabled={updating}
          className="btn-secondary"
        >
          Refresh List
        </button>
      </div>

      {/* Tracks List */}
      {tracks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-white font-semibold">Tracks to Update:</h4>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {tracks.map((track) => (
              <div 
                key={track.id} 
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="text-white font-medium">{track.title}</div>
                  <div className="text-gray-400 text-sm">
                    Current: {track.duration || 'Not set'}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateSingleTrackDuration(track)}
                    disabled={updating}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tracks.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No tracks found that need duration updates.</p>
          <p className="text-sm mt-2">
            Tracks with missing, default (3:30), or zero (0:00) durations will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
