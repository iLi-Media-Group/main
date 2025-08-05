import { useState, useRef, useCallback } from 'react';

interface GlobalAudioManager {
  currentPlayingId: string | null;
  play: (audioId: string, playFunction: () => void) => void;
  stop: (audioId: string) => void;
  isPlaying: (audioId: string) => boolean;
}

// Global audio manager singleton
class AudioManager {
  private static instance: AudioManager;
  private currentPlayingId: string | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  play(audioId: string, audioElement: HTMLAudioElement): void {
    // Stop any currently playing audio
    if (this.currentAudioElement && this.currentAudioElement !== audioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
    }
    
    // Set new current audio
    this.currentPlayingId = audioId;
    this.currentAudioElement = audioElement;
    
    // Play the new audio
    audioElement.play();
  }

  stop(audioId: string): void {
    if (this.currentPlayingId === audioId && this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
      this.currentPlayingId = null;
    }
  }

  isPlaying(audioId: string): boolean {
    return this.currentPlayingId === audioId;
  }

  getCurrentPlayingId(): string | null {
    return this.currentPlayingId;
  }
}

export function useGlobalAudioManager(): GlobalAudioManager {
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const audioManager = useRef(AudioManager.getInstance());

  const play = useCallback((audioId: string, playFunction: () => void) => {
    audioManager.current.play(audioId, playFunction);
    setCurrentPlayingId(audioId);
  }, []);

  const stop = useCallback((audioId: string) => {
    audioManager.current.stop(audioId);
    setCurrentPlayingId(null);
  }, []);

  const isPlaying = useCallback((audioId: string) => {
    return audioManager.current.isPlaying(audioId);
  }, []);

  return {
    currentPlayingId,
    play,
    stop,
    isPlaying
  };
} 