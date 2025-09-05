export interface Playlist {
  id: string;
  producer_id: string;
  name: string;
  description?: string;
  company_name?: string;
  logo_url?: string;
  photo_url?: string;
  is_public: boolean;
  slug: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  producer?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    avatar_path?: string;
  };
  tracks_count?: number;
  view_count?: number;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: string;
  // Joined fields
  track?: {
    id: string;
    title: string;
    artist: string;
    genres: string[];
    sub_genres: string[];
    moods: string[];
    instruments: string[];
    media_usage: string[];
    duration: string;
    bpm: number;
    audio_url: string;
    image_url: string;
    has_sting_ending: boolean;
    is_one_stop: boolean;
    mp3_url?: string;
    trackouts_url?: string;
    stems_url?: string;
    has_vocals: boolean;
    is_sync_only: boolean;
    track_producer_id: string;
    producer?: {
      id: string;
      first_name?: string;
      last_name?: string;
      email: string;
      avatar_path?: string;
    };
  };
}

export interface PlaylistView {
  id: string;
  playlist_id: string;
  viewer_ip?: string;
  user_agent?: string;
  viewed_at: string;
}

export interface CreatePlaylistData {
  name: string;
  description?: string;
  company_name?: string;
  logo_url?: string;
  photo_url?: string;
  is_public?: boolean;
}

export interface UpdatePlaylistData {
  name?: string;
  description?: string;
  company_name?: string;
  logo_url?: string;
  photo_url?: string;
  is_public?: boolean;
}

export interface PlaylistWithTracks extends Playlist {
  tracks: PlaylistTrack[];
}

export interface PlaylistAnalytics {
  totalViews: number;
  uniqueVisitors: number;
  totalTrackPlays: number;
  averageTimeOnPage: number;
  viewsByDay: Array<{ date: string; views: number }>;
  trackPlays: Array<{ trackTitle: string; plays: number }>;
  viewsByHour: Array<{ hour: string; views: number }>;
  topReferrers: Array<{ source: string; views: number }>;
  deviceTypes: Array<{ device: string; views: number }>;
  countries: Array<{ country: string; views: number }>;
}
