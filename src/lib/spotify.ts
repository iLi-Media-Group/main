// Spotify API Integration
// Handles track search, preview URL retrieval, and authentication

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  preview_url: string | null;
  external_urls: { spotify: string };
  duration_ms: number;
  popularity: number;
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
}

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

class SpotifyAPI {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID || '';
    this.clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET || '';
    
    if (!this.clientId || !this.clientSecret) {
      console.warn('Spotify API credentials not configured');
    }
  }

  // Get or refresh access token
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    
    // Return cached token if still valid
    if (this.accessToken && now < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(this.clientId + ':' + this.clientSecret)
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Spotify token request failed: ${response.status}`);
      }

      const data: SpotifyTokenResponse = await response.json();
      
      this.accessToken = data.access_token;
      this.tokenExpiry = now + (data.expires_in * 1000) - 60000; // Expire 1 minute early
      
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Spotify access token:', error);
      throw error;
    }
  }

  // Search for a track on Spotify
  async searchTrack(title: string, artist?: string): Promise<SpotifyTrack | null> {
    if (!this.clientId || !this.clientSecret) {
      console.warn('Spotify API not configured');
      return null;
    }

    try {
      const token = await this.getAccessToken();
      
      // Build search query
      let query = title;
      if (artist) {
        query += ` artist:${artist}`;
      }

      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1&market=US`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Spotify search failed: ${response.status}`);
      }

      const data: SpotifySearchResponse = await response.json();
      
      if (data.tracks.items.length === 0) {
        return null;
      }

      const track = data.tracks.items[0];
      
      // Only return if it has a preview URL
      if (!track.preview_url) {
        console.log('Track found but no preview URL available:', track.name);
        return null;
      }

      return track;
    } catch (error) {
      console.error('Spotify search error:', error);
      return null;
    }
  }

  // Get track details by Spotify ID
  async getTrackById(spotifyId: string): Promise<SpotifyTrack | null> {
    if (!this.clientId || !this.clientSecret) {
      return null;
    }

    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(
        `https://api.spotify.com/v1/tracks/${spotifyId}?market=US`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Spotify track fetch failed: ${response.status}`);
      }

      const track: SpotifyTrack = await response.json();
      
      if (!track.preview_url) {
        return null;
      }

      return track;
    } catch (error) {
      console.error('Spotify track fetch error:', error);
      return null;
    }
  }

  // Check if a preview URL is still valid
  async validatePreviewUrl(previewUrl: string): Promise<boolean> {
    try {
      const response = await fetch(previewUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Preview URL validation failed:', error);
      return false;
    }
  }

  // Format duration from milliseconds
  formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Export singleton instance
export const spotifyAPI = new SpotifyAPI();

// Helper function to search and update track
export async function searchAndUpdateTrack(
  trackId: string, 
  title: string, 
  artist?: string
): Promise<{
  success: boolean;
  spotifyTrack?: SpotifyTrack;
  error?: string;
}> {
  try {
    const spotifyTrack = await spotifyAPI.searchTrack(title, artist);
    
    if (!spotifyTrack) {
      return {
        success: false,
        error: 'No matching track found on Spotify'
      };
    }

    // Update the track in the database
    const { error } = await supabase
      .from('tracks')
      .update({
        spotify_track_id: spotifyTrack.id,
        spotify_preview_url: spotifyTrack.preview_url,
        spotify_external_url: spotifyTrack.external_urls.spotify,
        use_spotify_preview: true,
        spotify_search_attempted: true,
        spotify_last_searched: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', trackId);

    if (error) {
      throw error;
    }

    return {
      success: true,
      spotifyTrack
    };
  } catch (error) {
    console.error('Failed to search and update track:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper function to toggle Spotify preview usage
export async function toggleSpotifyPreview(
  trackId: string, 
  useSpotify: boolean
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tracks')
      .update({
        use_spotify_preview: useSpotify,
        updated_at: new Date().toISOString()
      })
      .eq('id', trackId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Failed to toggle Spotify preview:', error);
    return false;
  }
} 