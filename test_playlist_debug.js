// Test script to debug playlist viewing issue
// Run this in the browser console on mybeatfi.io

async function testPlaylistView() {
  console.log('Testing playlist view...');
  
  // Test the specific playlist URL
  const testSlug = 'john-sama/test-list';
  console.log('Testing slug:', testSlug);
  
  try {
    // Test the PlaylistService.getPlaylist method
    const response = await fetch('/api/playlist-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug: testSlug })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Playlist data:', data);
    } else {
      console.error('Error response:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Alternative: Test the database query directly
async function testDatabaseQuery() {
  console.log('Testing database query...');
  
  try {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('slug', 'john-sama/test-list');
    
    console.log('Database query result:', { data, error });
    
    if (data && data.length > 0) {
      console.log('Found playlist:', data[0]);
    } else {
      console.log('No playlist found with that slug');
    }
  } catch (error) {
    console.error('Database query failed:', error);
  }
}

// Run the tests
testPlaylistView();
testDatabaseQuery();
