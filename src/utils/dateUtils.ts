export function calculateTimeRemaining(expiryDate: string): string {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${days}d ${hours}h ${minutes}m`;
}

export function formatDuration(duration: string | number): string {
  // Handle null/undefined
  if (!duration) return '0:00';
  
  // Convert to string first to handle all cases
  const durationStr = String(duration);
  
  // If it's already in proper MM:SS format, return as is
  if (durationStr.match(/^\d{1,2}:\d{2}$/)) {
    const [minutes, seconds] = durationStr.split(':').map(Number);
    if (minutes >= 0 && seconds >= 0 && seconds < 60) {
      return durationStr; // Already properly formatted MM:SS
    }
  }
  
  // Handle "182:00" format (total seconds followed by ":00")
  if (durationStr.includes(':') && durationStr.endsWith(':00')) {
    const secondsPart = durationStr.split(':')[0];
    const totalSeconds = Number(secondsPart);
    if (!isNaN(totalSeconds) && totalSeconds > 0) {
      const minutes = Math.floor(totalSeconds / 60);
      const remainingSeconds = totalSeconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }
  
  // If duration is a string with colons, parse it
  if (typeof duration === 'string' && duration.includes(':')) {
    const parts = duration.split(':');
    if (parts.length === 3) {
      // HH:MM:SS format - convert to total seconds, then to MM:SS
      const [hours, minutes, seconds] = parts.map(Number);
      if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
        const finalMinutes = Math.floor(totalSeconds / 60);
        const finalSeconds = totalSeconds % 60;
        return `${finalMinutes}:${finalSeconds.toString().padStart(2, '0')}`;
      }
    } else if (parts.length === 2) {
      // MM:SS format - validate and return as is
      const [minutes, seconds] = parts.map(Number);
      if (!isNaN(minutes) && !isNaN(seconds) && seconds < 60) {
        return durationStr; // Already in correct MM:SS format
      }
    }
  }
  
  // Convert to number to handle string numbers like "182"
  const durationNum = Number(duration);
  
  // If it's a valid number, treat it as total seconds and convert to MM:SS
  if (!isNaN(durationNum) && isFinite(durationNum) && durationNum > 0) {
    const totalSeconds = Math.floor(durationNum);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  // If duration is already formatted or unknown, return as is
  return String(duration);
}
