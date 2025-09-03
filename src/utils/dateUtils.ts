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

export function formatDuration(duration: string): string {
  // If duration is in PostgreSQL interval format (e.g. "00:03:30"), convert to MM:SS
  if (duration.includes(':')) {
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
  
  // If duration is a number (seconds), convert to MM:SS
  if (!isNaN(Number(duration))) {
    const seconds = parseInt(duration);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  // If duration is already formatted, return as is
  return duration;
}
