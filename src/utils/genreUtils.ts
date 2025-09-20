// Utility functions for handling genre display

/**
 * Formats genres for display - handles both array and string formats
 * @param genres - Can be an array, JSON string, or regular string
 * @returns Clean, comma-separated string without brackets
 */
export function formatGenresForDisplay(genres: any): string {
  if (!genres) return 'Unknown';
  
  // If it's already an array, join it
  if (Array.isArray(genres)) {
    return genres.join(', ');
  }
  
  // If it's a string that looks like JSON array, parse it
  if (typeof genres === 'string') {
    // Handle JSON array format like ["Hip-Hop / Rap", "Electronic"]
    if (genres.startsWith('[') && genres.endsWith(']')) {
      try {
        const parsed = JSON.parse(genres);
        if (Array.isArray(parsed)) {
          return parsed.join(', ');
        }
      } catch (e) {
        // If parsing fails, fall back to cleaning the string
        return genres.replace(/[\[\]"]/g, '').replace(/,/g, ', ');
      }
    }
    
    // Handle comma-separated string
    if (genres.includes(',')) {
      return genres.split(',').map(g => g.trim()).join(', ');
    }
    
    // Single genre string
    return genres;
  }
  
  return 'Unknown';
}

/**
 * Formats moods for display - handles both array and string formats
 * @param moods - Can be an array, JSON string, or regular string
 * @returns Clean, comma-separated string without brackets
 */
export function formatMoodsForDisplay(moods: any): string {
  if (!moods) return 'N/A';
  
  // If it's already an array, join it
  if (Array.isArray(moods)) {
    return moods.join(', ');
  }
  
  // If it's a string that looks like JSON array, parse it
  if (typeof moods === 'string') {
    // Handle JSON array format like ["Energetic", "Upbeat"]
    if (moods.startsWith('[') && moods.endsWith(']')) {
      try {
        const parsed = JSON.parse(moods);
        if (Array.isArray(parsed)) {
          return parsed.join(', ');
        }
      } catch (e) {
        // If parsing fails, fall back to cleaning the string
        return moods.replace(/[\[\]"]/g, '').replace(/,/g, ', ');
      }
    }
    
    // Handle comma-separated string
    if (moods.includes(',')) {
      return moods.split(',').map(m => m.trim()).join(', ');
    }
    
    // Single mood string
    return moods;
  }
  
  return 'N/A';
}

/**
 * Formats sub-genres for display - handles both array and string formats
 * @param subGenres - Can be an array, JSON string, or regular string
 * @returns Clean, comma-separated string without brackets
 */
export function formatSubGenresForDisplay(subGenres: any): string {
  if (!subGenres) return 'N/A';
  
  // If it's already an array, join it
  if (Array.isArray(subGenres)) {
    return subGenres.join(', ');
  }
  
  // If it's a string that looks like JSON array, parse it
  if (typeof subGenres === 'string') {
    // Handle JSON array format like ["Sub-genre 1", "Sub-genre 2"]
    if (subGenres.startsWith('[') && subGenres.endsWith(']')) {
      try {
        const parsed = JSON.parse(subGenres);
        if (Array.isArray(parsed)) {
          return parsed.join(', ');
        }
      } catch (e) {
        // If parsing fails, fall back to cleaning the string
        return subGenres.replace(/[\[\]"]/g, '').replace(/,/g, ', ');
      }
    }
    
    // Handle comma-separated string
    if (subGenres.includes(',')) {
      return subGenres.split(',').map(g => g.trim()).join(', ');
    }
    
    // Single sub-genre string
    return subGenres;
  }
  
  return 'N/A';
}
