// Test Spotify API Integration
// Run this in your browser console to test the Spotify API

// Test function to verify Spotify API credentials
async function testSpotifyAPI() {
  console.log('🎵 Testing Spotify API Integration...');
  
  // Check if environment variables are set
  const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error('❌ Spotify credentials not configured');
    console.log('Please add REACT_APP_SPOTIFY_CLIENT_ID and REACT_APP_SPOTIFY_CLIENT_SECRET to your .env file');
    return;
  }
  
  console.log('✅ Spotify credentials found');
  
  try {
    // Test token request
    console.log('🔄 Testing token request...');
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
      },
      body: 'grant_type=client_credentials'
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Token request failed: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log('✅ Token request successful');
    
    // Test track search
    console.log('🔍 Testing track search...');
    const searchResponse = await fetch(
      'https://api.spotify.com/v1/search?q=Bohemian%20Rhapsody%20artist:Queen&type=track&limit=1&market=US',
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      }
    );
    
    if (!searchResponse.ok) {
      throw new Error(`Search request failed: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    const track = searchData.tracks?.items[0];
    
    if (track) {
      console.log('✅ Track search successful');
      console.log('📊 Track found:', {
        name: track.name,
        artist: track.artists[0]?.name,
        hasPreview: !!track.preview_url,
        previewUrl: track.preview_url,
        duration: `${Math.floor(track.duration_ms / 60000)}:${Math.floor((track.duration_ms % 60000) / 1000).toString().padStart(2, '0')}`
      });
      
      if (track.preview_url) {
        console.log('🎵 Preview URL available:', track.preview_url);
      } else {
        console.log('⚠️ No preview URL available for this track');
      }
    } else {
      console.log('⚠️ No tracks found in search');
    }
    
    console.log('🎉 Spotify API integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Spotify API test failed:', error);
  }
}

// Run the test
testSpotifyAPI(); 