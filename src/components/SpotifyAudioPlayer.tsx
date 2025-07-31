import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, AlertCircle } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';

interface SpotifyAudioPlayerProps {
  spotifyPreviewUrl?: string;
  mp3Url?: string;
  useSpotifyPreview?: boolean;
  title: string;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onToggle?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onPreviewTypeChange?: (useSpotify: boolean) => void;
}

export function SpotifyAudioPlayer({
  spotifyPreviewUrl,
  mp3Url,
  useSpotifyPreview = false,
  title,
  isPlaying = false,
  onPlay,
  onPause,
  onToggle,
  className = '',
  size = 'md',
  onPreviewTypeChange
}: SpotifyAudioPlayerProps) {
  const [useSpotify, setUseSpotify] = useState(useSpotifyPreview);
  const [spotifyError, setSpotifyError] = useState(false);
  const [mp3Error, setMp3Error] = useState(false);

  // Determine which audio source to use
  const getAudioSrc = (): string | null => {
    if (useSpotify && spotifyPreviewUrl && !spotifyError) {
      return spotifyPreviewUrl;
    }
    if (mp3Url && !mp3Error) {
      return mp3Url;
    }
    return null;
  };

  const audioSrc = getAudioSrc();

  // Handle Spotify preview errors
  const handleSpotifyError = () => {
    console.log('Spotify preview failed, falling back to MP3');
    setSpotifyError(true);
    setUseSpotify(false);
    if (onPreviewTypeChange) {
      onPreviewTypeChange(false);
    }
  };

  // Handle MP3 errors
  const handleMp3Error = () => {
    console.log('MP3 preview failed');
    setMp3Error(true);
  };

  // Toggle between Spotify and MP3 preview
  const togglePreviewType = () => {
    if (spotifyPreviewUrl && mp3Url) {
      const newUseSpotify = !useSpotify;
      setUseSpotify(newUseSpotify);
      setSpotifyError(false);
      setMp3Error(false);
      if (onPreviewTypeChange) {
        onPreviewTypeChange(newUseSpotify);
      }
    }
  };

  // Reset errors when props change
  useEffect(() => {
    setSpotifyError(false);
    setMp3Error(false);
  }, [spotifyPreviewUrl, mp3Url]);

  // Show error state if no audio source is available
  if (!audioSrc) {
    return (
      <div className={`flex items-center justify-center p-4 bg-red-500/10 rounded-lg ${className}`}>
        <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
        <span className="text-red-400 text-sm">No audio preview available</span>
      </div>
    );
  }

  // Show preview type selector if both sources are available
  const showPreviewSelector = spotifyPreviewUrl && mp3Url;

  return (
    <div className={className}>
      {showPreviewSelector && (
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={togglePreviewType}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              useSpotify
                ? 'bg-green-600 text-white'
                : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
            }`}
          >
            <Music className="w-3 h-3" />
            {useSpotify ? 'Spotify Preview' : 'MP3 Preview'}
          </button>
          {spotifyError && (
            <span className="text-xs text-yellow-400">
              Spotify failed, using MP3
            </span>
          )}
        </div>
      )}

      <AudioPlayer
        src={audioSrc}
        title={title}
        isPlaying={isPlaying}
        onPlay={onPlay}
        onPause={onPause}
        onToggle={onToggle}
        size={size}
        onError={useSpotify ? handleSpotifyError : handleMp3Error}
      />

      {/* Show preview source info */}
      {showPreviewSelector && (
        <div className="mt-2 text-xs text-gray-400">
          {useSpotify ? (
            <span>Using Spotify preview (30-second sample)</span>
          ) : (
            <span>Using MP3 preview</span>
          )}
        </div>
      )}
    </div>
  );
}

// Enhanced version with Spotify search integration
interface SpotifySearchAudioPlayerProps extends SpotifyAudioPlayerProps {
  trackId: string;
  onSpotifySearch?: (success: boolean, track?: any) => void;
}

export function SpotifySearchAudioPlayer({
  trackId,
  onSpotifySearch,
  ...props
}: SpotifySearchAudioPlayerProps) {
  const [searching, setSearching] = useState(false);

  const handleSpotifySearch = async () => {
    if (!props.title) return;

    setSearching(true);
    try {
      // Import the search function (you'll need to add this import)
      // const result = await searchAndUpdateTrack(trackId, props.title, props.artist);
      
      // For now, just simulate the search
      console.log('Searching Spotify for:', props.title);
      
      if (onSpotifySearch) {
        // onSpotifySearch(result.success, result.spotifyTrack);
      }
    } catch (error) {
      console.error('Spotify search failed:', error);
      if (onSpotifySearch) {
        onSpotifySearch(false);
      }
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      <SpotifyAudioPlayer {...props} />
      
      {/* Show search button if no Spotify preview is available */}
      {!props.spotifyPreviewUrl && props.title && (
        <button
          onClick={handleSpotifySearch}
          disabled={searching}
          className="mt-2 flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors"
        >
          {searching ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
              Searching...
            </>
          ) : (
            <>
              <Music className="w-3 h-3" />
              Search Spotify
            </>
          )}
        </button>
      )}
    </div>
  );
} 