import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [spotifyPreviewUrl, setSpotifyPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Determine which URL to use
  const spotifyUrl = track.spotify_external_url || '';
  const mp3Url = signedUrl || '';
  
  // Extract Spotify track ID if we have a URL
  const spotifyTrackId = spotifyUrl ? extractSpotifyId(spotifyUrl) : '';

  // Fetch Spotify preview URL if we have a track ID
  useEffect(() => {
    if (spotifyTrackId) {
      setIsLoadingPreview(true);
      spotifyAPI.getTrackById(spotifyTrackId)
        .then(trackData => {
          if (trackData && trackData.preview_url) {
            setSpotifyPreviewUrl(trackData.preview_url);
          }
        })
        .catch(err => {
          console.error('Failed to fetch Spotify preview:', err);
        })
        .finally(() => {
          setIsLoadingPreview(false);
        });
    }
  }, [spotifyTrackId]);

  // Determine which audio source to use
  const audioSrc = spotifyPreviewUrl || mp3Url;

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const width = bounds.width;
    const percentage = x / width;
    setProgress(percentage * 100);
  };

  if (loading || isLoadingPreview) {
    return (
      <div className="flex items-center justify-center h-16 bg-white/5 rounded-lg">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || audioError) {
    return (
      <div className="flex items-center justify-center h-16 bg-red-500/10 rounded-lg">
        <p className="text-red-400 text-sm">Audio unavailable</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Audio Player */}
      <div className="flex items-center space-x-4 bg-white/5 backdrop-blur-sm rounded-lg p-3">
        <button
          onClick={handlePlayPause}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white" />
          )}
        </button>
        
        <div className="flex-1">
          <p className="text-sm text-gray-200">{track.title}</p>
          <div 
            className="mt-1 h-1 bg-gray-700 rounded-full cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <button
          onClick={handleMute}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
        
        {/* Hidden audio element */}
        <audio 
          src={audioSrc} 
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => setAudioError('Failed to load audio')}
        />
      </div>

      {/* Status indicator */}
      {showToggle && (
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            {spotifyPreviewUrl ? '🎵 Spotify Preview' : '📁 Uploaded MP3'}
          </span>
        </div>
      )}
      
      {showToggle && showProducerMessage && !spotifyUrl && (
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