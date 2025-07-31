import React from 'react';

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

// Utility to extract Spotify Track ID from URL
function extractSpotifyId(url: string): string {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : '';
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
  // Determine which URL to use
  const spotifyUrl = track.spotify_external_url || '';
  const mp3Url = signedUrl || '';
  
  // Extract Spotify track ID if we have a URL
  const spotifyTrackId = spotifyUrl ? extractSpotifyId(spotifyUrl) : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-16 bg-white/5 rounded-lg">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-16 bg-red-500/10 rounded-lg">
        <p className="text-red-400 text-sm">Audio unavailable</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {spotifyTrackId ? (
        // Spotify link (opens in new tab)
        <div className="flex items-center justify-center h-16 bg-green-600/10 border border-green-500/20 rounded-lg">
          <div className="text-center">
            <div className="text-green-400 text-sm mb-1">🎵 Spotify Track Available</div>
            <a
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-300 hover:text-green-200 text-xs underline"
            >
              Open in Spotify →
            </a>
          </div>
        </div>
      ) : (
        // MP3 player
        <audio controls preload="none" className="w-full">
          <source src={mp3Url} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}
      
      {showToggle && spotifyUrl && (
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            {spotifyTrackId ? '🎵 Spotify Player' : '📁 Uploaded MP3'}
          </span>
        </div>
      )}
      
      {showToggle && showProducerMessage && !spotifyUrl && (
        <div className="group relative">
          <div className="text-xs text-gray-400 cursor-help">
            📁 This track will play the uploaded MP3
          </div>
          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            To change to a Spotify player, edit the track and add a Spotify link
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
} 