# Spotify API Integration for Track Previews

## Overview
Your idea to use Spotify links for track previews is excellent for protecting producers' music while still allowing previews. Here's how we can implement this:

## Spotify API Capabilities

### 1. **Track Search & Preview URLs**
- **Endpoint**: `GET https://api.spotify.com/v1/search`
- **Capability**: Search for tracks by title, artist, or other metadata
- **Preview URL**: Each track has a `preview_url` field (30-second preview)
- **Limitation**: Not all tracks have preview URLs available

### 2. **Track Details**
- **Endpoint**: `GET https://api.spotify.com/v1/tracks/{id}`
- **Returns**: Full track details including preview URL, duration, popularity, etc.

### 3. **Authentication**
- **Client Credentials Flow**: For public data access
- **User Authorization**: For user-specific features (not needed for previews)

## Implementation Strategy

### **Database Schema Changes**
```sql
-- Add Spotify-related fields to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS spotify_track_id TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS spotify_preview_url TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS spotify_external_url TEXT;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS use_spotify_preview BOOLEAN DEFAULT false;
```

### **Track Upload Form Enhancement**
1. **Spotify Search Integration**: Search for track on Spotify during upload
2. **Preview URL Storage**: Store Spotify preview URL if found
3. **Fallback Logic**: Use MP3 if Spotify preview unavailable
4. **User Choice**: Allow producers to choose Spotify vs MP3 preview

### **Audio Player Enhancement**
```typescript
interface AudioPlayerProps {
  src: string;
  spotifyPreviewUrl?: string;
  useSpotifyPreview?: boolean;
  fallbackSrc?: string; // MP3 file
  title: string;
  // ... other props
}
```

## Benefits

### **For Producers**
- ✅ **Better Protection**: No direct MP3 access
- ✅ **Professional Presentation**: Spotify branding
- ✅ **Analytics**: Track plays through Spotify
- ✅ **Revenue**: Potential streaming revenue

### **For Clients**
- ✅ **High Quality**: Spotify's optimized previews
- ✅ **Familiar Interface**: Spotify's player
- ✅ **No Download Risk**: Can't download preview audio
- ✅ **Better Experience**: Professional preview system

### **For Platform**
- ✅ **Reduced Storage**: Less MP3 storage needed
- ✅ **Better Performance**: Spotify's CDN
- ✅ **Legal Protection**: No direct file hosting
- ✅ **Professional Image**: Spotify integration

## Technical Implementation

### **1. Spotify API Setup**
```typescript
// Spotify API configuration
const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

// Get access token
async function getSpotifyToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
    },
    body: 'grant_type=client_credentials'
  });
  return response.json();
}
```

### **2. Track Search Function**
```typescript
async function searchSpotifyTrack(title: string, artist?: string) {
  const token = await getSpotifyToken();
  const query = artist ? `${title} artist:${artist}` : title;
  
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
    {
      headers: {
        'Authorization': `Bearer ${token.access_token}`
      }
    }
  );
  
  const data = await response.json();
  return data.tracks?.items[0] || null;
}
```

### **3. Enhanced Audio Player**
```typescript
export function SpotifyAudioPlayer({ 
  spotifyPreviewUrl, 
  fallbackSrc, 
  title,
  ...props 
}: SpotifyAudioPlayerProps) {
  const [useSpotify, setUseSpotify] = useState(!!spotifyPreviewUrl);
  const [spotifyError, setSpotifyError] = useState(false);
  
  const audioSrc = useSpotify && spotifyPreviewUrl && !spotifyError 
    ? spotifyPreviewUrl 
    : fallbackSrc;
  
  // Fallback to MP3 if Spotify fails
  const handleSpotifyError = () => {
    setSpotifyError(true);
    setUseSpotify(false);
  };
  
  return (
    <div>
      {spotifyPreviewUrl && (
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setUseSpotify(!useSpotify)}
            className="text-xs bg-green-600 px-2 py-1 rounded"
          >
            {useSpotify ? 'Spotify Preview' : 'MP3 Preview'}
          </button>
        </div>
      )}
      <AudioPlayer 
        src={audioSrc} 
        title={title}
        onError={useSpotify ? handleSpotifyError : undefined}
        {...props}
      />
    </div>
  );
}
```

## Implementation Steps

### **Phase 1: Setup**
1. **Spotify Developer Account**: Register app
2. **Environment Variables**: Add Spotify credentials
3. **Database Migration**: Add Spotify fields
4. **API Integration**: Basic search functionality

### **Phase 2: Upload Enhancement**
1. **Track Search**: Search Spotify during upload
2. **Preview Storage**: Store Spotify preview URLs
3. **User Interface**: Allow choice between Spotify/MP3
4. **Validation**: Ensure preview URLs work

### **Phase 3: Player Enhancement**
1. **Enhanced Audio Player**: Support Spotify previews
2. **Fallback Logic**: Graceful MP3 fallback
3. **Error Handling**: Handle Spotify API failures
4. **User Experience**: Smooth transitions

### **Phase 4: Optimization**
1. **Caching**: Cache Spotify search results
2. **Analytics**: Track preview usage
3. **Performance**: Optimize API calls
4. **Monitoring**: Track success rates

## Considerations

### **Limitations**
- **Not All Tracks**: Some tracks don't have preview URLs
- **30-Second Limit**: Spotify previews are short
- **API Rate Limits**: Need to handle rate limiting
- **Search Accuracy**: May not find exact matches

### **Costs**
- **Spotify API**: Free tier available (1000 requests/hour)
- **Development Time**: Integration effort
- **Maintenance**: API changes and monitoring

### **Legal**
- **Terms of Service**: Follow Spotify's API terms
- **Attribution**: Proper Spotify branding
- **Usage Limits**: Respect API rate limits

## Recommendation

This is a **great idea** that would significantly improve the platform's security and professionalism. I recommend implementing it in phases, starting with the basic Spotify search during track upload and gradually enhancing the audio player experience.

The fallback to MP3 ensures the platform remains functional even when Spotify previews aren't available, making it a robust solution. 