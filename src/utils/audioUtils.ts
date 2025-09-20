// Audio utility functions for calculating track durations and metadata

/**
 * Calculate the duration of an audio file from its URL
 * @param audioUrl - The URL of the audio file
 * @returns Promise<string> - Duration in MM:SS format
 */
export async function calculateAudioDuration(audioUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    
    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration;
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      resolve(formattedDuration);
    });
    
    audio.addEventListener('error', (error) => {
      console.error('Error loading audio for duration calculation:', error);
      reject(new Error('Failed to load audio for duration calculation'));
    });
    
    // Set crossOrigin to handle CORS issues
    audio.crossOrigin = 'anonymous';
    audio.src = audioUrl;
  });
}

/**
 * Format duration from seconds to MM:SS format
 * @param seconds - Duration in seconds
 * @returns string - Duration in MM:SS format
 */
export function formatDurationFromSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Parse duration from MM:SS format to seconds
 * @param duration - Duration in MM:SS format
 * @returns number - Duration in seconds
 */
export function parseDurationToSeconds(duration: string): number {
  if (!duration || typeof duration !== 'string') return 0;
  
  const parts = duration.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return (minutes * 60) + seconds;
  } else if (parts.length === 1) {
    // If it's just seconds
    return parseInt(parts[0]) || 0;
  }
  
  return 0;
}

/**
 * Validate duration format (MM:SS)
 * @param duration - Duration string to validate
 * @returns boolean - True if valid format
 */
export function isValidDurationFormat(duration: string): boolean {
  if (!duration || typeof duration !== 'string') return false;
  
  const regex = /^\d{1,2}:\d{2}$/;
  if (!regex.test(duration)) return false;
  
  const parts = duration.split(':');
  const minutes = parseInt(parts[0]);
  const seconds = parseInt(parts[1]);
  
  return minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59;
}

/**
 * Get audio metadata including duration, bitrate, etc.
 * @param audioUrl - The URL of the audio file
 * @returns Promise<AudioMetadata> - Audio metadata
 */
export interface AudioMetadata {
  duration: number;
  durationFormatted: string;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
}

export async function getAudioMetadata(audioUrl: string): Promise<AudioMetadata> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    
    audio.addEventListener('loadedmetadata', () => {
      const metadata: AudioMetadata = {
        duration: audio.duration,
        durationFormatted: formatDurationFromSeconds(audio.duration)
      };
      
      // Try to get additional metadata if available
      if ((audio as any).mozGetMetadataObject) {
        const mozMetadata = (audio as any).mozGetMetadataObject();
        if (mozMetadata) {
          metadata.bitrate = mozMetadata.bitrate;
          metadata.sampleRate = mozMetadata.sampleRate;
          metadata.channels = mozMetadata.channels;
        }
      }
      
      resolve(metadata);
    });
    
    audio.addEventListener('error', (error) => {
      console.error('Error loading audio for metadata extraction:', error);
      reject(new Error('Failed to load audio for metadata extraction'));
    });
    
    audio.crossOrigin = 'anonymous';
    audio.src = audioUrl;
  });
}
