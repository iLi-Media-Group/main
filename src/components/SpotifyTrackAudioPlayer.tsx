import React, { useState, useEffect, useRef } from 'react';
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Determine which URL to use
  const spotifyUrl = track.spotify_external_url || '';
  const mp3Url = signedUrl || '';
  
  // Extract Spotify track ID if we have a URL
  const spotifyTrackId = spotifyUrl ? extractSpotifyId(spotifyUrl) : '';

  // Fetch Spotify preview URL if we have a track ID and use_spotify_preview is true
  useEffect(() => {
    if (spotifyTrackId && track.use_spotify_preview !== false) {
      setIsLoadingPreview(true);
      spotifyAPI.getTrackById(spotifyTrackId)
        .then(trackData => {
          console.log('Spotify track data:', trackData);
          if (trackData && trackData.preview_url) {
            console.log('Setting Spotify preview URL:', trackData.preview_url);
            setSpotifyPreviewUrl(trackData.preview_url);
          } else {
            console.log('No preview URL available for Spotify track');
          }
        })
        .catch(err => {
          console.error('Failed to fetch Spotify preview:', err);
        })
        .finally(() => {
          setIsLoadingPreview(false);
        });
    }
  }, [spotifyTrackId, track.use_spotify_preview]);

  // Determine which audio source to use
  const audioSrc = spotifyPreviewUrl || mp3Url;
  console.log('Audio source:', { spotifyPreviewUrl, mp3Url, finalSrc: audioSrc });

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.error('Failed to play audio:', err);
          setAudioError('Failed to play audio');
        });
      }
    }
  };

  const handleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration > 0) {
      const bounds = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const width = bounds.width;
      const percentage = x / width;
      const newTime = percentage * duration;
      audioRef.current.currentTime = newTime;
      setProgress(percentage * 100);
    }
  };

  // Update progress and time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (duration > 0) {
        const progressPercent = (currentTime / duration) * 100;
        setProgress(progressPercent);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      updateProgress();
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      console.error('Audio error:', audio.error);
      setAudioError('Failed to load audio');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [duration, currentTime]);

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
        {audioError && <p className="text-red-300 text-xs mt-1">{audioError}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Audio Player */}
      <div className="flex items-center space-x-4 bg-white/5 backdrop-blur-sm rounded-lg p-3">
        <button
          onClick={handlePlayPause}
          disabled={!audioSrc}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          disabled={!audioSrc}
          className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
        
        {/* Hidden audio element */}
        <audio 
          ref={audioRef}
          src={audioSrc} 
          preload="metadata"
          muted={isMuted}
        />
      </div>

      {/* Status indicator */}
      {showToggle && (
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            {spotifyPreviewUrl ? '🎵 Spotify Preview' : '📁 Uploaded MP3'}
          </span>
          {audioSrc && (
            <span className="text-xs text-gray-500">
              {spotifyPreviewUrl ? 'Spotify' : 'MP3'} • {duration > 0 ? `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}` : '--:--'}
            </span>
          )}
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