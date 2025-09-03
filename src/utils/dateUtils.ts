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
  
  // Convert to number first to handle string numbers like "182"
  const durationNum = Number(duration);
  
  // If it's a valid number, treat it as total seconds and convert to MM:SS
  if (!isNaN(durationNum) && isFinite(durationNum)) {
    const totalSeconds = Math.floor(durationNum);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  // If duration is a string with colons, parse it
  if (typeof duration === 'string' && duration.includes(':')) {
    const parts = duration.split(':');
    if (parts.length === 3) {
      // HH:MM:SS format - convert to total minutes and seconds
      const [hours, minutes, seconds] = parts.map(Number);
      const totalMinutes = (hours * 60) + minutes;
      return `${totalMinutes}:${seconds.toString().padStart(2, '0')}`;
    } else if (parts.length === 2) {
      // MM:SS format - return as is
      return duration;
    }
  }
  
  // If duration is already formatted or unknown, return as is
  return String(duration);
}
