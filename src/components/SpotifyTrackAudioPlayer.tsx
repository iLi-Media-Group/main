import React, { useState, useEffect } from 'react';
import { AudioPlayer } from './AudioPlayer';
import { spotifyAPI } from '../lib/spotify';

interface Track {
  id: string;
  title: string;
  audio_url: string;
  spotify_track_id?: string;
  spotify_external_url?: string;
  use_spotify_preview?: boolean;
}

interface SpotifyTrackAudioPlayerProps {
  track: Track;
  signedUrl?: string | null;
  loading?: boolean;
  error?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showToggle?: boolean;
  showProducerMessage?: boolean;
}

export function SpotifyTrackAudioPlayer({ 
  track, 
  signedUrl, 
  loading = false, 
  error = false,
  size = 'md',
  showToggle = true,
  showProducerMessage = false
}: SpotifyTrackAudioPlayerProps) {
  const [spotifyPreviewUrl, setSpotifyPreviewUrl] = useState<string | null>(null);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [useSpotify, setUseSpotify] = useState(false);

  // Check if we should use Spotify preview
  useEffect(() => {
    const shouldUseSpotify = track.spotify_track_id && track.use_spotify_preview !== false;
    setUseSpotify(!!shouldUseSpotify);
  }, [track.spotify_track_id, track.use_spotify_preview]);

  // Fetch Spotify preview URL if needed
  useEffect(() => {
    const fetchSpotifyPreview = async () => {
      if (!useSpotify || !track.spotify_track_id) return;

      setSpotifyLoading(true);
      try {
        const spotifyTrack = await spotifyAPI.getTrackById(track.spotify_track_id);
        if (spotifyTrack && spotifyTrack.preview_url) {
          setSpotifyPreviewUrl(spotifyTrack.preview_url);
        } else {
          // Fall back to MP3 if no Spotify preview
          setUseSpotify(false);
        }
      } catch (error) {
        console.error('Failed to fetch Spotify preview:', error);
        setUseSpotify(false);
      } finally {
        setSpotifyLoading(false);
      }
    };

    fetchSpotifyPreview();
  }, [useSpotify, track.spotify_track_id]);

  // Determine which audio source to use
  const audioSrc = useSpotify && spotifyPreviewUrl ? spotifyPreviewUrl : (signedUrl || '');
  const isLoading = (useSpotify && spotifyLoading) || (!useSpotify && loading);
  const hasError = !useSpotify && error;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-16 bg-white/5 rounded-lg">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-16 bg-red-500/10 rounded-lg">
        <p className="text-red-400 text-sm">Audio unavailable</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AudioPlayer src={audioSrc} title={track.title} size={size} />
      {showToggle && track.spotify_track_id && (
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            {useSpotify ? '🎵 Spotify Preview' : '📁 Uploaded MP3'}
          </span>
          <button
            onClick={() => setUseSpotify(!useSpotify)}
            className="text-blue-400 hover:text-blue-300 transition-colors"
            disabled={!track.spotify_track_id}
          >
            Switch to {useSpotify ? 'MP3' : 'Spotify'}
          </button>
        </div>
      )}
      {showToggle && showProducerMessage && !track.spotify_track_id && (
        <div className="group relative">
          <div className="text-xs text-gray-400 cursor-help">
            📁 This track will play the uploaded MP3
          </div>
          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            To change to a Spotify preview, edit the track and add a Spotify link
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
} 