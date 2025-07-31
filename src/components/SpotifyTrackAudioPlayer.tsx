import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Square } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  audioUrl: string;
}

interface AudioPlayerProps {
  track: Track;
  signedUrl?: string | null;
  loading?: boolean;
  error?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showToggle?: boolean;
  showProducerMessage?: boolean;
}

// Global audio manager to ensure only one player is active at a time
class AudioManager {
  private static instance: AudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentPlayerId: string | null = null;

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  play(audio: HTMLAudioElement, playerId: string): void {
    // Stop any currently playing audio
    if (this.currentAudio && this.currentAudio !== audio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
    
    // Set new current audio
    this.currentAudio = audio;
    this.currentPlayerId = playerId;
    
    // Play the new audio
    audio.play();
  }

  stop(playerId: string): void {
    if (this.currentPlayerId === playerId && this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.currentPlayerId = null;
    }
  }

  isCurrentPlayer(playerId: string): boolean {
    return this.currentPlayerId === playerId;
  }
}

export function AudioPlayer({ 
  track, 
  signedUrl, 
  loading = false, 
  error = false,
  size = 'md',
  showToggle = true,
  showProducerMessage = false
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerId = useRef(`player-${track.id}-${Date.now()}`);

  // Get audio manager instance
  const audioManager = AudioManager.getInstance();

  // Use the signed URL for audio
  const audioSrc = signedUrl || '';

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        audioManager.stop(playerId.current);
      } else {
        audioManager.play(audioRef.current, playerId.current);
      }
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioManager.stop(playerId.current);
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

    const handlePlay = () => {
      setIsPlaying(true);
      // Check if this player is still the current one
      if (!audioManager.isCurrentPlayer(playerId.current)) {
        setIsPlaying(false);
      }
    };
    
    const handlePause = () => {
      setIsPlaying(false);
    };
    
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

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      audioManager.stop(playerId.current);
    };
  }, []);

  if (loading) {
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

  // Compact version for track cards
  if (size === 'sm') {
    return (
      <div className="relative">
        <button
          onClick={handlePlayPause}
          disabled={!audioSrc}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={audioSrc ? 'Play/Pause' : 'No audio available'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white" />
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
          title={audioSrc ? 'Play/Pause' : 'No audio available'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white" />
          )}
        </button>

        <button
          onClick={handleStop}
          disabled={!audioSrc || !isPlaying}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-600 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Stop"
        >
          <Square className="w-4 h-4 text-white" />
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
          <span>📁 Uploaded MP3</span>
          {audioSrc && (
            <span className="text-xs text-gray-500">
              MP3 • {duration > 0 ? `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}` : '--:--'}
            </span>
          )}
        </div>
      )}
    </div>
  );
} 